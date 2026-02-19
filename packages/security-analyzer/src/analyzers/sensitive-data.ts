import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerResult, SecurityCategory } from '../types/security';

interface PatternCheck {
  pattern: RegExp;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  cweId?: string;
}

const SENSITIVE_PATTERNS: PatternCheck[] = [
  {
    pattern: /\/\.git\//i,
    title: 'Git repository exposed',
    description: 'Version control directory accessible',
    severity: 'critical',
    recommendation: 'Block access to .git directory in web server configuration',
    cweId: 'CWE-538',
  },
  {
    pattern: /\/\.env/i,
    title: 'Environment file exposed',
    description: 'Configuration file potentially accessible',
    severity: 'critical',
    recommendation: 'Ensure .env files are not publicly accessible',
    cweId: 'CWE-540',
  },
  {
    pattern: /\/(admin|dashboard|control-panel)/i,
    title: 'Admin interface detected',
    description: 'Administrative interface found',
    severity: 'medium',
    recommendation: 'Ensure admin interfaces require authentication and use strong passwords',
    cweId: 'CWE-306',
  },
  {
    pattern: /\/(api|graphql|v\d+)\//i,
    title: 'API endpoints detected',
    description: 'API endpoints discovered',
    severity: 'medium',
    recommendation: 'Ensure APIs require authentication and implement rate limiting',
    cweId: 'CWE-284',
  },
  {
    pattern: /\/(debug|test|dev|staging)/i,
    title: 'Debug/development endpoints',
    description: 'Development or debug endpoints accessible',
    severity: 'high',
    recommendation: 'Remove or restrict access to debug endpoints in production',
    cweId: 'CWE-489',
  },
  {
    pattern: /\.(bak|backup|old|tmp|swp)$/i,
    title: 'Backup files detected',
    description: 'Backup or temporary files accessible',
    severity: 'high',
    recommendation: 'Remove backup files from publicly accessible directories',
    cweId: 'CWE-530',
  },
  {
    pattern: /\/\.svn\//i,
    title: 'SVN repository exposed',
    description: 'Subversion repository accessible',
    severity: 'critical',
    recommendation: 'Block access to .svn directory in web server configuration',
    cweId: 'CWE-538',
  },
];

export class SensitiveDataAnalyzer extends BaseAnalyzer {
  protected getCategory(): SecurityCategory {
    return 'sensitive-data';
  }

  async analyze(): Promise<AnalyzerResult> {
    this.checkSensitiveUrls();
    this.checkErrorExposure();

    return this.getResult();
  }

  private checkSensitiveUrls(): void {
    const allUrls = new Set<string>();

    for (const page of this.crawlData.pages) {
      allUrls.add(page.url);
      for (const request of page.requests) {
        allUrls.add(request.url);
      }
    }

    for (const patternCheck of SENSITIVE_PATTERNS) {
      const matchingUrls = Array.from(allUrls).filter((url) =>
        patternCheck.pattern.test(url)
      );

      if (matchingUrls.length > 0) {
        this.addIssue({
          severity: patternCheck.severity,
          title: patternCheck.title,
          description: `${matchingUrls.length} URL(s) match sensitive pattern`,
          affectedUrls: matchingUrls.slice(0, 10),
          recommendation: patternCheck.recommendation,
          cweId: patternCheck.cweId,
        });
      } else {
        this.incrementPassed();
      }
    }
  }

  private checkErrorExposure(): void {
    const pagesWithErrors = this.crawlData.pages.filter((page) => page.error);

    if (pagesWithErrors.length > 0) {
      const verboseErrors = pagesWithErrors.filter((page) =>
        this.isVerboseError(page.error!)
      );

      if (verboseErrors.length > 0) {
        this.addIssue({
          severity: 'medium',
          title: 'Verbose error messages',
          description: 'Error pages may expose sensitive information',
          affectedUrls: verboseErrors.map((p) => p.url).slice(0, 10),
          recommendation: 'Use generic error messages in production',
          cweId: 'CWE-209',
          evidence: verboseErrors[0].error,
        });
      }
    }

    if (pagesWithErrors.length === 0) {
      this.incrementPassed();
    }
  }

  private isVerboseError(error: string): boolean {
    const verbosePatterns = [
      /stack trace/i,
      /at\s+[\w.]+\s*\(/i,
      /line\s+\d+/i,
      /file\s+.*\.php/i,
      /exception/i,
      /mysql|postgresql|mongodb/i,
    ];

    return verbosePatterns.some((pattern) => pattern.test(error));
  }
}
