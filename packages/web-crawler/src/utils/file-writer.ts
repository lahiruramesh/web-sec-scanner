import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { Logger } from './logger';
import type { CrawlResult } from '../types/index';

export class FileWriter {
  static async writeCrawlResult(
    result: CrawlResult,
    filePath: string
  ): Promise<void> {
    try {
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });

      const json = JSON.stringify(result, null, 2);
      await writeFile(filePath, json, 'utf-8');

      Logger.success(`Results saved to: ${filePath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to write output file: ${errorMessage}`);
      throw error;
    }
  }

  static generateDefaultFilename(baseDir: string = 'output'): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    return `${baseDir}/crawl-${timestamp}.json`;
  }
}
