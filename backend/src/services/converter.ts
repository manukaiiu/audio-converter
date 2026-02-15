import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { probe, convert, ConversionProgress, ConversionResult } from '../utils/ffmpeg.js';
import { FlacFile } from './scanner.js';

export interface JobProgress {
  currentFile: string;
  currentFileIndex: number;
  totalFiles: number;
  fileProgress: number;
  fileEta: number;
  overallProgress: number;
  overallEta: number;
}

export interface JobResult {
  totalFiles: number;
  successful: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

type ProgressCallback = (progress: JobProgress) => void;
type FileCompleteCallback = (file: string, success: boolean, error?: string) => void;
type JobCompleteCallback = (result: JobResult) => void;

let currentJob: {
  cancel: () => void;
  cancelled: boolean;
} | null = null;

/**
 * Start a conversion job
 */
export async function startConversion(
  files: FlacFile[],
  sourceRoot: string,
  targetRoot: string,
  onProgress: ProgressCallback,
  onFileComplete: FileCompleteCallback,
  onJobComplete: JobCompleteCallback
): Promise<void> {
  const result: JobResult = {
    totalFiles: files.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  let cancelled = false;

  currentJob = {
    cancel: () => { cancelled = true; },
    cancelled: false
  };

  const startTime = Date.now();
  let completedDuration = 0;
  let totalDuration = 0;

  // Probe all files first to get total duration
  const durations: number[] = [];
  for (const file of files) {
    try {
      const duration = await probe(file.path);
      durations.push(duration);
      totalDuration += duration;
    } catch {
      durations.push(180); // Default to 3 minutes if probe fails
      totalDuration += 180;
    }
  }

  for (let i = 0; i < files.length; i++) {
    if (cancelled) {
      break;
    }

    const file = files[i];
    const duration = durations[i];
    const outputPath = join(targetRoot, file.relativePath.replace(/\.flac$/i, '.m4a'));

    // Ensure output directory exists
    await mkdir(dirname(outputPath), { recursive: true });

    const conversionResult = await convert(
      file.path,
      outputPath,
      duration,
      (progress: ConversionProgress) => {
        const fileProgress = progress.percentage;
        const completedSoFar = completedDuration + (duration * progress.percentage / 100);
        const overallProgress = (completedSoFar / totalDuration) * 100;

        // Estimate overall ETA based on progress rate
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = completedSoFar / elapsed;
        const remaining = totalDuration - completedSoFar;
        const overallEta = rate > 0 ? remaining / rate : remaining;

        onProgress({
          currentFile: file.name,
          currentFileIndex: i + 1,
          totalFiles: files.length,
          fileProgress,
          fileEta: progress.eta,
          overallProgress,
          overallEta
        });
      }
    );

    completedDuration += duration;

    if (conversionResult.success) {
      result.successful++;
      onFileComplete(file.name, true);
    } else {
      result.failed++;
      result.errors.push({ file: file.name, error: conversionResult.error || 'Unknown error' });
      onFileComplete(file.name, false, conversionResult.error);
    }
  }

  currentJob = null;
  onJobComplete(result);
}

/**
 * Cancel the current conversion job
 */
export function cancelConversion(): boolean {
  if (currentJob) {
    currentJob.cancel();
    return true;
  }
  return false;
}

/**
 * Check if a conversion is in progress
 */
export function isConverting(): boolean {
  return currentJob !== null;
}
