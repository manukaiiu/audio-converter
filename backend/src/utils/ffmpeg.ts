import { spawn, SpawnOptions } from 'child_process';
import path from 'path';

// Windows spawn options to prevent console window popups and handle paths correctly
const spawnOptions: SpawnOptions = {
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true // Use shell on Windows to handle paths correctly
};

// Normalize path for ffmpeg (use native path separators)
function normalizePath(p: string): string {
  return path.normalize(p);
}

/**
 * Check if ffmpeg is available in the system PATH
 */
export async function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version'], spawnOptions);

    proc.on('error', () => {
      resolve(false);
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Get duration of an audio file using ffprobe
 */
export async function probe(filePath: string): Promise<number> {
  const normalizedPath = normalizePath(filePath);

  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      `"${normalizedPath}"`
    ], spawnOptions);

    let output = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`ffprobe error: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (isNaN(duration)) {
          reject(new Error('Could not parse duration'));
        } else {
          resolve(duration);
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });
  });
}

export interface ConversionProgress {
  file: string;
  currentTime: number;
  totalDuration: number;
  percentage: number;
  speed: number;
  eta: number;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  error?: string;
}

/**
 * Convert a FLAC file to M4A
 */
export async function convert(
  inputPath: string,
  outputPath: string,
  totalDuration: number,
  onProgress: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  const normalizedInput = normalizePath(inputPath);
  const normalizedOutput = normalizePath(outputPath);

  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', [
      '-i', `"${normalizedInput}"`,
      '-c:a', 'aac',
      '-b:a', '256k',
      '-c:v', 'copy',
      '-map', '0',
      '-movflags', '+faststart',
      '-y', // Overwrite output file if exists
      `"${normalizedOutput}"`
    ], spawnOptions);

    let stderrBuffer = '';

    // ffmpeg outputs progress to stderr
    proc.stderr?.on('data', (data) => {
      const output = data.toString();
      stderrBuffer += output;

      // Parse time progress: time=00:01:23.45
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      const speedMatch = output.match(/speed=\s*([\d.]+)x/);

      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);
        const centiseconds = parseInt(timeMatch[4], 10);

        const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
        const percentage = Math.min(100, (currentTime / totalDuration) * 100);
        const speed = speedMatch ? parseFloat(speedMatch[1]) : 1;
        const remaining = totalDuration - currentTime;
        const eta = speed > 0 ? remaining / speed : remaining;

        onProgress({
          file: inputPath,
          currentTime,
          totalDuration,
          percentage,
          speed,
          eta
        });
      }
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        inputPath,
        outputPath,
        error: err.message
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          inputPath,
          outputPath
        });
      } else {
        // Include last part of stderr for debugging
        const lastError = stderrBuffer.slice(-500);
        resolve({
          success: false,
          inputPath,
          outputPath,
          error: `ffmpeg exited with code ${code}. Last output: ${lastError}`
        });
      }
    });
  });
}
