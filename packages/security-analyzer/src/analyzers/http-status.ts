import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerResult, SecurityCategory } from '../types/security';

export class HTTPStatusAnalyzer extends BaseAnalyzer {
  protected getCategory(): SecurityCategory {
    return 'http-status';
  }

  async analyze(): Promise<AnalyzerResult> {
    this.checkBrokenLinks();
    this.checkServerErrors();
    this.checkExcessiveRedirects();

    return this.getResult();
  }

  private checkBrokenLinks(): void {
    const brokenPages = this.crawlData.pages.filter((page) => {
      const mainResponse = page.responses.find((r) => r.url === page.url);
      return mainResponse && (mainResponse.status === 404 || mainResponse.status === 410);
    });

    if (brokenPages.length > 0) {
      this.addIssue({
        severity: 'low',
        title: 'Broken links detected',
        description: `${brokenPages.length} page(s) returning 404/410 status`,
        affectedUrls: brokenPages.map((p) => p.url).slice(0, 10),
        recommendation: 'Fix or remove broken links to improve user experience',
      });
    } else {
      this.incrementPassed();
    }
  }

  private checkServerErrors(): void {
    const errorPages = this.crawlData.pages.filter((page) => {
      const mainResponse = page.responses.find((r) => r.url === page.url);
      return mainResponse && mainResponse.status >= 500;
    });

    const errorRate = errorPages.length / this.crawlData.totalPages;

    if (errorPages.length > 0) {
      const severity = errorRate > 0.05 ? 'high' : errorRate > 0.02 ? 'medium' : 'low';

      this.addIssue({
        severity,
        title: 'Server errors detected',
        description: `${errorPages.length} page(s) returning 5xx errors (${(errorRate * 100).toFixed(1)}% error rate)`,
        affectedUrls: errorPages.map((p) => p.url).slice(0, 10),
        recommendation: 'Investigate and fix server errors to ensure service reliability',
        evidence: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
      });
    } else {
      this.incrementPassed();
    }
  }

  private checkExcessiveRedirects(): void {
    const pagesWithManyRedirects: string[] = [];

    for (const page of this.crawlData.pages) {
      const redirectCount = page.responses.filter((r) =>
        r.status >= 300 && r.status < 400
      ).length;

      if (redirectCount > 3) {
        pagesWithManyRedirects.push(page.url);
      } else if (redirectCount === 0) {
        this.incrementPassed();
      }
    }

    if (pagesWithManyRedirects.length > 0) {
      this.addIssue({
        severity: 'medium',
        title: 'Excessive redirect chains',
        description: `${pagesWithManyRedirects.length} page(s) with >3 redirects`,
        affectedUrls: pagesWithManyRedirects.slice(0, 10),
        recommendation: 'Reduce redirect chains to improve performance and user experience',
      });
    }
  }
}
