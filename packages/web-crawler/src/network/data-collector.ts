import type { CrawlResult, CrawlSummary, PageResult } from '../types/index';

export class DataCollector {
  static buildCrawlResult(
    startUrl: string,
    startTime: number,
    pageResults: PageResult[]
  ): CrawlResult {
    const endTime = Date.now();
    const summary = this.calculateSummary(pageResults);

    const successfulPages = pageResults.filter((p) => !p.error).length;
    const failedPages = pageResults.filter((p) => p.error).length;

    return {
      startUrl,
      startTime,
      endTime,
      totalPages: pageResults.length,
      successfulPages,
      failedPages,
      pages: pageResults,
      summary,
    };
  }

  private static calculateSummary(pageResults: PageResult[]): CrawlSummary {
    const statusCodes: Record<number, number> = {};
    const domainsSet = new Set<string>();
    let totalRequests = 0;
    let totalResponses = 0;

    for (const page of pageResults) {
      totalRequests += page.requests.length;
      totalResponses += page.responses.length;

      for (const response of page.responses) {
        statusCodes[response.status] = (statusCodes[response.status] || 0) + 1;

        try {
          const domain = new URL(response.url).hostname;
          domainsSet.add(domain);
        } catch {
        }
      }
    }

    return {
      totalRequests,
      totalResponses,
      statusCodes,
      uniqueDomains: Array.from(domainsSet).sort(),
    };
  }

  static getTopStatusCodes(
    statusCodes: Record<number, number>,
    limit: number = 10
  ): Array<[number, number]> {
    return Object.entries(statusCodes)
      .map(([code, count]) => [parseInt(code, 10), count] as [number, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}
