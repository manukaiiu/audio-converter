import { Router, Request, Response } from 'express';
import { checkFfmpeg } from '../utils/ffmpeg.js';
import { scanFolder } from '../services/scanner.js';
import { startConversion, cancelConversion, isConverting } from '../services/converter.js';
import { reorganizeFolder } from '../services/reorganizer.js';
import { emitProgress, emitFileComplete, emitJobComplete, emitError } from '../websocket/progress.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const ffmpegOk = await checkFfmpeg();
  res.json({
    status: 'ok',
    ffmpeg: ffmpegOk,
    converting: isConverting()
  });
});

// Scan folder for FLAC files
apiRouter.post('/scan', async (req: Request, res: Response) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    res.status(400).json({ error: 'folderPath is required' });
    return;
  }

  try {
    const result = await scanFolder(folderPath);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Start conversion
apiRouter.post('/convert', async (req: Request, res: Response) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    res.status(400).json({ error: 'folderPath is required' });
    return;
  }

  if (isConverting()) {
    res.status(409).json({ error: 'Conversion already in progress' });
    return;
  }

  try {
    const scanResult = await scanFolder(folderPath);

    if (scanResult.needsConversion.length === 0) {
      res.json({ message: 'No files need conversion', result: scanResult });
      return;
    }

    // Start conversion in background
    startConversion(
      scanResult.needsConversion,
      scanResult.sourceRoot,
      scanResult.targetRoot,
      emitProgress,
      emitFileComplete,
      emitJobComplete
    ).catch((err) => {
      emitError(err instanceof Error ? err.message : 'Conversion failed');
    });

    res.json({
      message: 'Conversion started',
      totalFiles: scanResult.needsConversion.length
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Cancel conversion
apiRouter.post('/cancel', (_req: Request, res: Response) => {
  const cancelled = cancelConversion();
  res.json({ cancelled });
});

// Get current status
apiRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    converting: isConverting()
  });
});

// Reorganize folder structure
apiRouter.post('/reorganize', async (req: Request, res: Response) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    res.status(400).json({ error: 'folderPath is required' });
    return;
  }

  if (isConverting()) {
    res.status(409).json({ error: 'Cannot reorganize while conversion is in progress' });
    return;
  }

  try {
    const result = await reorganizeFolder(folderPath);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
