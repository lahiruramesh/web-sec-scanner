import { readFile } from 'fs/promises';
import { z } from 'zod';
import type { CrawlResult } from '../types/security';

const RequestDataSchema = z.object({
  url: z.string(),
  method: z.string(),
  headers: z.record(z.string()),
  timestamp: z.number(),
  resourceType: z.string(),
});

const ResponseDataSchema = z.object({
  url: z.string(),
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string()),
  timestamp: z.number(),
  bodySize: z.number().optional(),
  contentType: z.string().optional(),
  redirected: z.boolean(),
  fromCache: z.boolean(),
});

const PageResultSchema = z.object({
  url: z.string(),
  depth: z.number(),
  timestamp: z.number(),
  loadTime: z.number(),
  requests: z.array(RequestDataSchema),
  responses: z.array(ResponseDataSchema),
  links: z.array(z.string()),
  error: z.string().optional(),
});

const CrawlSummarySchema = z.object({
  totalRequests: z.number(),
  totalResponses: z.number(),
  statusCodes: z.record(z.number()),
  uniqueDomains: z.array(z.string()),
});

const CrawlResultSchema = z.object({
  startUrl: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  totalPages: z.number(),
  successfulPages: z.number(),
  failedPages: z.number(),
  pages: z.array(PageResultSchema),
  summary: CrawlSummarySchema,
});

export async function loadCrawlResult(filePath: string): Promise<CrawlResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    return CrawlResultSchema.parse(json);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid crawl data format: ${error.errors[0].message}`);
    }
    throw error;
  }
}
