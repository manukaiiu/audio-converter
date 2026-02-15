import { promises as fs } from 'fs';
import path from 'path';

export interface ReorganizeResult {
  success: boolean;
  movedFiles: number;
  flacFolder: string;
}

/**
 * Reorganizes a flat folder structure into flac/m4a subfolders
 * Moves all FLAC files into a new 'flac' subfolder
 */
export async function reorganizeFolder(folderPath: string): Promise<ReorganizeResult> {
  const flacFolder = path.join(folderPath, 'flac');

  // Check if flac folder already exists
  try {
    await fs.access(flacFolder);
    throw new Error('Folder already has a flac subfolder');
  } catch (err) {
    // Expected - folder doesn't exist yet
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  // Find all FLAC files in the root folder
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const flacFiles = entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.flac'))
    .map(entry => entry.name);

  if (flacFiles.length === 0) {
    throw new Error('No FLAC files found in folder');
  }

  // Create flac subfolder
  await fs.mkdir(flacFolder, { recursive: true });

  // Move each FLAC file
  let movedFiles = 0;
  for (const filename of flacFiles) {
    const sourcePath = path.join(folderPath, filename);
    const targetPath = path.join(flacFolder, filename);

    await fs.rename(sourcePath, targetPath);
    movedFiles++;
  }

  return {
    success: true,
    movedFiles,
    flacFolder
  };
}
