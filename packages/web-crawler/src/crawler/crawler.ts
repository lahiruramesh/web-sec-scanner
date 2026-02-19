import { chromium, type Browser, type Page } from 'playwright';
import type { CrawlerConfig, PageResult, RequestData, ResponseData } from '../types/index';
import { UrlManager } from './url-manager';
import { LinkExtractor } from './link-extractor';
import { Logger } from '../utils/logger';

export class Crawler {
  private config: CrawlerConfig;
  private urlManager: UrlManager;
  private browser: Browser | null = null;
  private pageResults: PageResult[] = [];

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.urlManager = new UrlManager(
      config.startUrl,
      config.includeSubdomains || false
    );
  }

  async crawl(): Promise<PageResult[]> {
    try {
      await this.launchBrowser();

      let pagesProcessed = 0;

      while (!this.urlManager.isEmpty()) {
        if (this.config.maxPages && pagesProcessed >= this.config.maxPages) {
          Logger.info(`Reached max pages limit: ${this.config.maxPages}`);
          break;
        }

        const item = this.urlManager.dequeue();
        if (!item) break;

        const { url, depth } = item;

        if (this.config.maxDepth !== undefined && depth > this.config.maxDepth) {
          continue;
        }

        if (this.urlManager.isVisited(url)) {
          continue;
        }

        this.urlManager.markVisited(url);

        const pageResult = await this.crawlPage(url, depth);
        this.pageResults.push(pageResult);

        if (!pageResult.error) {
          for (const link of pageResult.links) {
            this.urlManager.enqueue(link, depth + 1);
          }
        }

        pagesProcessed++;
      }

      return this.pageResults;
    } finally {
      await this.closeBrowser();
    }
  }

  private async launchBrowser(): Promise<void> {
    Logger.info('Launching browser...');
    this.browser = await chromium.launch({
      headless: this.config.headless !== false,
    });
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async crawlPage(url: string, depth: number): Promise<PageResult> {
    const startTime = Date.now();
    const requests: RequestData[] = [];
    const responses: ResponseData[] = [];
    let links: string[] = [];
    let error: string | undefined;

    let page: Page | null = null;

    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      page = await this.browser.newPage();

      page.on('request', (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          resourceType: request.resourceType(),
          timestamp: Date.now(),
        });
      });

      page.on('response', (response) => {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: Date.now(),
          contentType: response.headers()['content-type'],
          redirected: response.request().redirectedFrom() !== null,
          fromCache: response.fromServiceWorker(),
        });
      });

      await page.goto(url, {
        timeout: this.config.timeout || 30000,
        waitUntil: 'networkidle',
      });

      links = await LinkExtractor.extractLinks(page, url);

      Logger.success(`Crawled: ${url} (depth: ${depth}, links: ${links.length})`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      Logger.error(`Failed to crawl ${url}: ${error}`);
    } finally {
      if (page) {
        await page.close();
      }
    }

    const loadTime = Date.now() - startTime;

    return {
      url,
      depth,
      timestamp: startTime,
      loadTime,
      requests,
      responses,
      links,
      error,
    };
  }

  getProgress(): { visited: number; queued: number; processed: number } {
    return {
      visited: this.urlManager.getVisitedCount(),
      queued: this.urlManager.getQueueSize(),
      processed: this.pageResults.length,
    };
  }
}
