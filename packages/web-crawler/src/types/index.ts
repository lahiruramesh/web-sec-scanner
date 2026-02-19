export interface CrawlerConfig {
  startUrl: string;
  maxPages?: number;
  timeout?: number;
  maxDepth?: number;
  includeSubdomains?: boolean;
  headless?: boolean;
  outputFile?: string;
}

export interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  resourceType: string;
}

export interface ResponseData {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
  bodySize?: number;
  contentType?: string;
  redirected: boolean;
  fromCache: boolean;
}

export interface PageResult {
  url: string;
  depth: number;
  timestamp: number;
  loadTime: number;
  requests: RequestData[];
  responses: ResponseData[];
  links: string[];
  error?: string;
}

export interface CrawlResult {
  startUrl: string;
  startTime: number;
  endTime: number;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  pages: PageResult[];
  summary: CrawlSummary;
}

export interface CrawlSummary {
  totalRequests: number;
  totalResponses: number;
  statusCodes: Record<number, number>;
  uniqueDomains: string[];
}

export interface QueueItem {
  url: string;
  depth: number;
}
