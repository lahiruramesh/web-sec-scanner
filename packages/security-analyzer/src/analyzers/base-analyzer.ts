import type { CrawlResult, SecurityIssue, AnalyzerResult, SecurityCategory } from '../types/security';

export abstract class BaseAnalyzer {
  protected issues: SecurityIssue[] = [];
  protected passed = 0;
  protected failed = 0;
  protected warnings = 0;

  constructor(protected crawlData: CrawlResult) {}

  abstract analyze(): Promise<AnalyzerResult>;

  protected abstract getCategory(): SecurityCategory;

  protected addIssue(issue: Omit<SecurityIssue, 'category'>): void {
    this.issues.push({
      ...issue,
      category: this.getCategory(),
    });

    if (issue.severity === 'critical' || issue.severity === 'high') {
      this.failed++;
    } else if (issue.severity === 'medium') {
      this.warnings++;
    }
  }

  protected incrementPassed(): void {
    this.passed++;
  }

  protected getResult(): AnalyzerResult {
    return {
      category: this.getCategory(),
      issues: this.issues,
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
    };
  }
}
