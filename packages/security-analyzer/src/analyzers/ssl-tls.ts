import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerResult, SecurityCategory } from '../types/security';

export class SSLTLSAnalyzer extends BaseAnalyzer {
  protected getCategory(): SecurityCategory {
    return 'ssl-tls';
  }

  async analyze(): Promise<AnalyzerResult> {
    this.checkHttpPages();
    this.checkMixedContent();
    this.checkInsecureRedirects();

    return this.getResult();
  }

  private checkHttpPages(): void {
    const httpPages = this.crawlData.pages.filter((page) =>
      page.url.startsWith('http://') && !page.url.startsWith('https://')
    );

    if (httpPages.length > 0) {
      this.addIssue({
        severity: 'high',
        title: 'Pages served over HTTP',
        description: `${httpPages.length} page(s) served over insecure HTTP protocol`,
        affectedUrls: httpPages.map((p) => p.url).slice(0, 10),
        recommendation: 'Redirect all HTTP traffic to HTTPS and enable HSTS',
        cweId: 'CWE-319',
      });
    } else {
      this.incrementPassed();
    }
  }

  private checkMixedContent(): void {
    const pagesWithMixedContent: string[] = [];
    const mixedContentUrls: string[] = [];

    for (const page of this.crawlData.pages) {
      if (!page.url.startsWith('https://')) continue;

      const httpResources = page.requests.filter(
        (req) => req.url.startsWith('http://') && !req.url.startsWith('https://')
      );

      if (httpResources.length > 0) {
        pagesWithMixedContent.push(page.url);
        mixedContentUrls.push(...httpResources.map((r) => r.url));
      } else {
        this.incrementPassed();
      }
    }

    if (pagesWithMixedContent.length > 0) {
      this.addIssue({
        severity: 'high',
        title: 'Mixed content detected',
        description: 'HTTPS pages loading HTTP resources',
        affectedUrls: pagesWithMixedContent.slice(0, 10),
        recommendation: 'Ensure all resources are loaded over HTTPS',
        cweId: 'CWE-311',
        evidence: `HTTP resources: ${[...new Set(mixedContentUrls)].slice(0, 5).join(', ')}`,
      });
    }
  }

  private checkInsecureRedirects(): void {
    const pagesWithInsecureRedirects: string[] = [];

    for (const page of this.crawlData.pages) {
      const redirectedResponses = page.responses.filter((r) => r.redirected);

      for (const response of redirectedResponses) {
        if (
          response.url.startsWith('http://') &&
          !this.hasHSTS(response.headers)
        ) {
          pagesWithInsecureRedirects.push(page.url);
          break;
        }
      }
    }

    if (pagesWithInsecureRedirects.length > 0) {
      this.addIssue({
        severity: 'medium',
        title: 'Insecure HTTP redirects',
        description: 'HTTP redirects without HSTS protection',
        affectedUrls: pagesWithInsecureRedirects.slice(0, 10),
        recommendation: 'Enable HSTS header to prevent insecure redirects',
        cweId: 'CWE-319',
      });
    } else {
      this.incrementPassed();
    }
  }

  private hasHSTS(headers: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'strict-transport-security' && value) {
        return true;
      }
    }
    return false;
  }
}
