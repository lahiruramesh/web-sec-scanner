import chalk from 'chalk';
import Table from 'cli-table3';
import type { CrawlResult } from '../types/index';
import { Logger } from '../utils/logger';
import { DataCollector } from '../network/data-collector';

export class OutputFormatter {
  static displayConsoleOutput(result: CrawlResult): void {
    console.log('\n');
    Logger.success('Crawl completed successfully!');
    console.log('\n');

    this.displaySummary(result);
    console.log('\n');

    this.displayStatusCodeDistribution(result);
    console.log('\n');

    this.displaySamplePages(result);
    console.log('\n');
  }

  private static displaySummary(result: CrawlResult): void {
    const duration = result.endTime - result.startTime;
    const durationSeconds = (duration / 1000).toFixed(1);

    console.log(chalk.bold.cyan('Summary'));
    console.log(chalk.gray('─'.repeat(50)));

    const summaryData = [
      ['Total Pages', result.totalPages],
      ['Successful', chalk.green(result.successfulPages)],
      ['Failed', result.failedPages > 0 ? chalk.red(result.failedPages) : result.failedPages],
      ['Total Requests', result.summary.totalRequests],
      ['Total Responses', result.summary.totalResponses],
      ['Unique Domains', result.summary.uniqueDomains.length],
      ['Duration', `${durationSeconds}s`],
    ];

    for (const [label, value] of summaryData) {
      console.log(`  ${chalk.bold(label + ':')} ${value}`);
    }
  }

  private static displayStatusCodeDistribution(result: CrawlResult): void {
    console.log(chalk.bold.cyan('Status Code Distribution'));

    const table = new Table({
      head: [chalk.bold('Status Code'), chalk.bold('Count'), chalk.bold('Percentage')],
      colWidths: [15, 10, 15],
    });

    const topStatusCodes = DataCollector.getTopStatusCodes(result.summary.statusCodes);
    const totalResponses = result.summary.totalResponses;

    for (const [code, count] of topStatusCodes) {
      const percentage = ((count / totalResponses) * 100).toFixed(1);
      const coloredCode = this.colorizeStatusCode(code);
      table.push([coloredCode, count, `${percentage}%`]);
    }

    console.log(table.toString());
  }

  private static displaySamplePages(result: CrawlResult): void {
    console.log(chalk.bold.cyan('Sample Pages (first 5)'));

    const table = new Table({
      head: [
        chalk.bold('URL'),
        chalk.bold('Depth'),
        chalk.bold('Links'),
        chalk.bold('Requests'),
        chalk.bold('Status'),
      ],
      colWidths: [50, 8, 8, 10, 10],
    });

    const samplePages = result.pages.slice(0, 5);

    for (const page of samplePages) {
      const url = this.truncateUrl(page.url, 48);
      const status = page.error ? chalk.red('Failed') : chalk.green('Success');
      table.push([url, page.depth, page.links.length, page.requests.length, status]);
    }

    console.log(table.toString());

    if (result.pages.length > 5) {
      console.log(chalk.gray(`  ... and ${result.pages.length - 5} more pages`));
    }
  }

  private static colorizeStatusCode(code: number): string {
    if (code >= 200 && code < 300) {
      return chalk.green(code);
    } else if (code >= 300 && code < 400) {
      return chalk.yellow(code);
    } else if (code >= 400 && code < 500) {
      return chalk.red(code);
    } else if (code >= 500) {
      return chalk.magenta(code);
    } else {
      return chalk.gray(code);
    }
  }

  private static truncateUrl(url: string, maxLength: number): string {
    if (url.length <= maxLength) {
      return url;
    }
    return url.substring(0, maxLength - 3) + '...';
  }

  static displayErrors(result: CrawlResult): void {
    const failedPages = result.pages.filter((p) => p.error);

    if (failedPages.length === 0) {
      return;
    }

    console.log('\n');
    console.log(chalk.bold.red('Failed Pages'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const page of failedPages) {
      console.log(`  ${chalk.red('✗')} ${page.url}`);
      console.log(`    ${chalk.gray(page.error)}`);
    }
  }
}
