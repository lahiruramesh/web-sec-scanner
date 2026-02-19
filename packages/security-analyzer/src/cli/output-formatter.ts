import chalk from 'chalk';
import Table from 'cli-table3';
import { writeFile } from 'fs/promises';
import type { SecurityReport, SecurityIssue } from '../types/security';

export class OutputFormatter {
  formatConsoleReport(report: SecurityReport): void {
    console.log('\n' + chalk.bold.cyan('Security Analysis Report'));
    console.log(chalk.cyan('═'.repeat(60)));

    this.printOverview(report);
    this.printCategoryTable(report);
    this.printCriticalIssues(report);

    if (report.aiAnalysis) {
      this.printAIInsights(report);
      this.printPriorityRecommendations(report);
    }

    console.log('\n');
  }

  private printOverview(report: SecurityReport): void {
    const riskColor = this.getRiskColor(report.riskLevel);

    console.log('\n' + chalk.bold('Overall Score: ') +
      chalk.bold(riskColor(`${report.overallScore}/100`)) +
      chalk.bold(riskColor(` (${report.riskLevel.toUpperCase()})`))
    );

    console.log(chalk.gray('Analyzed: ') + report.metadata.crawlStartUrl);
    console.log(
      chalk.gray('Pages: ') + report.metadata.totalPagesAnalyzed +
      chalk.gray(' | Requests: ') + report.metadata.totalRequestsAnalyzed
    );
  }

  private printCategoryTable(report: SecurityReport): void {
    const table = new Table({
      head: ['Category', 'Score', 'Issues', 'Passed', 'Warnings'].map((h) =>
        chalk.bold(h)
      ),
      colWidths: [25, 10, 10, 10, 12],
    });

    for (const analysis of report.categoryAnalyses) {
      const scoreColor = this.getScoreColor(analysis.score);
      table.push([
        this.formatCategoryName(analysis.category),
        scoreColor(analysis.score.toString()),
        analysis.issues.length.toString(),
        analysis.passed.toString(),
        analysis.warnings.toString(),
      ]);
    }

    console.log('\n' + table.toString());
  }

  private printCriticalIssues(report: SecurityReport): void {
    const criticalIssues = this.getCriticalIssues(report);

    if (criticalIssues.length === 0) return;

    console.log('\n' + chalk.bold.red(`Critical Issues (${criticalIssues.length})`));
    console.log(chalk.red('─'.repeat(60)));

    for (const issue of criticalIssues.slice(0, 10)) {
      console.log(
        chalk.red('✗ ') + chalk.bold(issue.title)
      );
      console.log(
        chalk.gray('  Severity: ') +
        this.getSeverityColor(issue.severity)(issue.severity.toUpperCase()) +
        (issue.cweId ? chalk.gray(' | ') + issue.cweId : '')
      );
      console.log(chalk.gray('  Affects: ') + `${issue.affectedUrls.length} pages`);
      console.log(chalk.gray('  → ') + issue.recommendation);
      console.log('');
    }
  }

  private printAIInsights(report: SecurityReport): void {
    if (!report.aiAnalysis || report.aiAnalysis.insights.length === 0) return;

    console.log('\n' + chalk.bold.magenta('AI Insights'));
    console.log(chalk.magenta('─'.repeat(60)));

    for (const insight of report.aiAnalysis.insights) {
      console.log(chalk.magenta('• ') + insight);
    }

    if (report.aiAnalysis.riskAssessment) {
      console.log('\n' + chalk.bold('Risk Assessment:'));
      console.log(chalk.gray(report.aiAnalysis.riskAssessment));
    }
  }

  private printPriorityRecommendations(report: SecurityReport): void {
    if (!report.aiAnalysis || report.aiAnalysis.priorityRecommendations.length === 0) return;

    console.log('\n' + chalk.bold.green('Priority Recommendations'));
    console.log(chalk.green('─'.repeat(60)));

    report.aiAnalysis.priorityRecommendations.forEach((rec, index) => {
      console.log(chalk.green(`${index + 1}. `) + rec);
    });
  }

  async writeJSONReport(report: SecurityReport, outputPath: string): Promise<void> {
    const json = JSON.stringify(report, null, 2);
    await writeFile(outputPath, json, 'utf-8');
  }

  private getCriticalIssues(report: SecurityReport): SecurityIssue[] {
    const allIssues = report.categoryAnalyses.flatMap((ca) => ca.issues);
    return allIssues
      .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getScoreColor(score: number): (text: string) => string {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    if (score >= 40) return chalk.hex('#FFA500');
    return chalk.red;
  }

  private getRiskColor(riskLevel: string): (text: string) => string {
    if (riskLevel === 'Low Risk') return chalk.green;
    if (riskLevel === 'Medium Risk') return chalk.yellow;
    if (riskLevel === 'High Risk') return chalk.hex('#FFA500');
    return chalk.red;
  }

  private getSeverityColor(severity: string): (text: string) => string {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity === 'critical') return chalk.red.bold;
    if (lowerSeverity === 'high') return chalk.red;
    if (lowerSeverity === 'medium') return chalk.yellow;
    if (lowerSeverity === 'low') return chalk.blue;
    return chalk.gray;
  }
}
