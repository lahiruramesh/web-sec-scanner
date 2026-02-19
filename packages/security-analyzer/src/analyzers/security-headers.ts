import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerResult, SecurityCategory, SeverityLevel } from '../types/security';

interface HeaderCheck {
  name: string;
  severity: SeverityLevel;
  recommendation: string;
  cweId?: string;
  validate?: (value: string) => { valid: boolean; issues?: string[] };
}

const SECURITY_HEADERS: HeaderCheck[] = [
  {
    name: 'content-security-policy',
    severity: 'high',
    recommendation: 'Implement CSP with strict directives to prevent XSS attacks',
    cweId: 'CWE-693',
  },
  {
    name: 'strict-transport-security',
    severity: 'high',
    recommendation: 'Enable HSTS with max-age of at least 31536000 and includeSubDomains',
    cweId: 'CWE-319',
  },
  {
    name: 'x-frame-options',
    severity: 'medium',
    recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking',
    cweId: 'CWE-1021',
  },
  {
    name: 'x-content-type-options',
    severity: 'medium',
    recommendation: 'Set X-Content-Type-Options to nosniff to prevent MIME sniffing',
    cweId: 'CWE-430',
  },
  {
    name: 'referrer-policy',
    severity: 'low',
    recommendation: 'Set Referrer-Policy to no-referrer or strict-origin-when-cross-origin',
  },
  {
    name: 'permissions-policy',
    severity: 'low',
    recommendation: 'Configure Permissions-Policy to control browser features',
  },
];

export class SecurityHeadersAnalyzer extends BaseAnalyzer {
  protected getCategory(): SecurityCategory {
    return 'security-headers';
  }

  async analyze(): Promise<AnalyzerResult> {
    const pagesWithHeaders = this.crawlData.pages.filter(
      (page) => page.responses.some((r) => r.status >= 200 && r.status < 300)
    );

    if (pagesWithHeaders.length === 0) {
      return this.getResult();
    }

    for (const headerCheck of SECURITY_HEADERS) {
      this.checkHeader(headerCheck, pagesWithHeaders);
    }

    this.checkCSPDirectives(pagesWithHeaders);

    return this.getResult();
  }

  private checkHeader(
    headerCheck: HeaderCheck,
    pages: typeof this.crawlData.pages
  ): void {
    const pagesMissingHeader: string[] = [];

    for (const page of pages) {
      const successResponse = page.responses.find(
        (r) => r.status >= 200 && r.status < 300
      );

      if (!successResponse) continue;

      const headerValue = this.getHeaderValue(successResponse.headers, headerCheck.name);

      if (!headerValue) {
        pagesMissingHeader.push(page.url);
      } else if (headerCheck.validate) {
        const validation = headerCheck.validate(headerValue);
        if (!validation.valid) {
          this.addIssue({
            severity: headerCheck.severity,
            title: `Weak ${headerCheck.name} header`,
            description: validation.issues?.join('; ') || 'Header has security issues',
            affectedUrls: [page.url],
            recommendation: headerCheck.recommendation,
            cweId: headerCheck.cweId,
            evidence: headerValue,
          });
        } else {
          this.incrementPassed();
        }
      } else {
        this.incrementPassed();
      }
    }

    if (pagesMissingHeader.length > 0) {
      this.addIssue({
        severity: headerCheck.severity,
        title: `Missing ${headerCheck.name} header`,
        description: `${pagesMissingHeader.length} page(s) missing critical security header`,
        affectedUrls: pagesMissingHeader.slice(0, 10),
        recommendation: headerCheck.recommendation,
        cweId: headerCheck.cweId,
      });
    }
  }

  private checkCSPDirectives(pages: typeof this.crawlData.pages): void {
    const unsafeCSPPages: string[] = [];
    const unsafeDirectives: string[] = [];

    for (const page of pages) {
      const successResponse = page.responses.find(
        (r) => r.status >= 200 && r.status < 300
      );

      if (!successResponse) continue;

      const csp = this.getHeaderValue(successResponse.headers, 'content-security-policy');
      if (!csp) continue;

      const unsafe = this.findUnsafeCSPDirectives(csp);
      if (unsafe.length > 0) {
        unsafeCSPPages.push(page.url);
        unsafeDirectives.push(...unsafe);
      }
    }

    if (unsafeCSPPages.length > 0) {
      this.addIssue({
        severity: 'medium',
        title: 'Unsafe CSP directives detected',
        description: 'CSP contains potentially unsafe directives',
        affectedUrls: unsafeCSPPages.slice(0, 10),
        recommendation: 'Remove unsafe-inline, unsafe-eval, and wildcard (*) from CSP directives',
        cweId: 'CWE-693',
        evidence: [...new Set(unsafeDirectives)].join(', '),
      });
    }
  }

  private findUnsafeCSPDirectives(csp: string): string[] {
    const unsafe: string[] = [];
    const lowerCSP = csp.toLowerCase();

    if (lowerCSP.includes("'unsafe-inline'")) unsafe.push("'unsafe-inline'");
    if (lowerCSP.includes("'unsafe-eval'")) unsafe.push("'unsafe-eval'");
    if (lowerCSP.includes('*') && !lowerCSP.includes('*.')  ) unsafe.push('wildcard (*)');
    if (lowerCSP.includes('data:')) unsafe.push('data:');

    return unsafe;
  }

  private getHeaderValue(headers: Record<string, string>, name: string): string | undefined {
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    return undefined;
  }
}
