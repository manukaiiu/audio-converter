import { readdir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';
import { existsSync } from 'fs';

export interface FlacFile {
  path: string;
  relativePath: string;
  name: string;
}

export interface ScanResult {
  sourceRoot: string;
  targetRoot: string;
  totalFiles: number;
  needsConversion: FlacFile[];
  alreadyConverted: number;
  structure: 'already-organized' | 'flat-flac' | 'album-folders' | 'mixed' | 'no-flac';
}

/**
 * Recursively find all FLAC files in a directory
 */
async function findFlacFiles(dir: string, baseDir: string): Promise<FlacFile[]> {
  const files: FlacFile[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findFlacFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.flac') {
        files.push({
          path: fullPath,
          relativePath: relative(baseDir, fullPath),
          name: entry.name
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err);
  }

  return files;
}

/**
 * Detect the folder structure type
 */
async function detectStructure(dir: string): Promise<ScanResult['structure']> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    const hasFlacFolder = entries.some(e => e.isDirectory() && e.name.toLowerCase() === 'flac');
    const hasM4aFolder = entries.some(e => e.isDirectory() && e.name.toLowerCase() === 'm4a');
    const hasFlacFiles = entries.some(e => e.isFile() && extname(e.name).toLowerCase() === '.flac');
    const hasSubdirs = entries.some(e => e.isDirectory() && !['flac', 'm4a'].includes(e.name.toLowerCase()));

    if (hasFlacFolder) {
      return 'already-organized';
    }

    if (hasFlacFiles && !hasSubdirs) {
      return 'flat-flac';
    }

    if (hasSubdirs) {
      // Check if subdirs contain FLAC files
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = join(dir, entry.name);
          const subEntries = await readdir(subPath);
          if (subEntries.some(f => extname(f).toLowerCase() === '.flac')) {
            return 'album-folders';
          }
        }
      }
    }

    if (hasFlacFiles) {
      return 'mixed';
    }

    return 'no-flac';
  } catch {
    return 'no-flac';
  }
}

/**
 * Check if a FLAC file needs conversion (M4A doesn't exist)
 */
function needsConversion(flacFile: FlacFile, sourceRoot: string, targetRoot: string): boolean {
  const m4aRelativePath = flacFile.relativePath.replace(/\.flac$/i, '.m4a');
  const m4aPath = join(targetRoot, m4aRelativePath);
  return !existsSync(m4aPath);
}

/**
 * Scan a folder for FLAC files and determine conversion needs
 */
export async function scanFolder(folderPath: string): Promise<ScanResult> {
  const structure = await detectStructure(folderPath);

  let sourceRoot: string;
  let targetRoot: string;

  if (structure === 'already-organized') {
    sourceRoot = join(folderPath, 'flac');
    targetRoot = join(folderPath, 'm4a');
  } else {
    // For other structures, use the folder as-is for now
    // The UI will prompt about reorganization
    sourceRoot = folderPath;
    targetRoot = join(folderPath, 'm4a');
  }

  const allFlacFiles = await findFlacFiles(sourceRoot, sourceRoot);
  const filesToConvert = allFlacFiles.filter(f => needsConversion(f, sourceRoot, targetRoot));

  return {
    sourceRoot,
    targetRoot,
    totalFiles: allFlacFiles.length,
    needsConversion: filesToConvert,
    alreadyConverted: allFlacFiles.length - filesToConvert.length,
    structure
  };
}
