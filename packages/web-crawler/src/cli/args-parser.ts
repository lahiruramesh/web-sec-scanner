import { Command } from 'commander';
import type { CrawlerConfig } from '../types/index';
import { Logger } from '../utils/logger';

export class ArgsParser {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .name('web-crawler')
      .description(
        'CLI tool to crawl websites and analyze network traffic using Playwright'
      )
      .version('1.0.0')
      .argument('<url>', 'Starting URL to crawl')
      .option(
        '--max-pages <number>',
        'Maximum number of pages to crawl',
        this.parsePositiveInt
      )
      .option(
        '--max-depth <number>',
        'Maximum crawl depth',
        this.parsePositiveInt
      )
      .option(
        '--timeout <ms>',
        'Page load timeout in milliseconds',
        this.parsePositiveInt,
        30000
      )
      .option(
        '--output <file>',
        'JSON output file path (default: output/crawl-{timestamp}.json)'
      )
      .option(
        '--include-subdomains',
        'Include subdomains in crawl',
        false
      )
      .option(
        '--headful',
        'Show browser window (for debugging)',
        false
      );
  }

  private parsePositiveInt(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid number: ${value}. Must be a positive integer.`);
    }
    return parsed;
  }

  private validateUrl(url: string): string {
    try {
      const parsed = new URL(url);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }

      return parsed.href;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Invalid URL: ${url}`);
      }
      throw error;
    }
  }

  parse(argv: string[]): CrawlerConfig {
    this.program.parse(argv);

    const url = this.program.args[0];
    const options = this.program.opts();

    const validatedUrl = this.validateUrl(url);

    const config: CrawlerConfig = {
      startUrl: validatedUrl,
      maxPages: options.maxPages,
      maxDepth: options.maxDepth,
      timeout: options.timeout,
      outputFile: options.output,
      includeSubdomains: options.includeSubdomains,
      headless: !options.headful,
    };

    return config;
  }

  showHelp(): void {
    this.program.help();
  }

  static parseWithErrorHandling(argv: string[]): CrawlerConfig | null {
    try {
      const parser = new ArgsParser();
      return parser.parse(argv);
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(error.message);
      } else {
        Logger.error('Failed to parse command-line arguments');
      }
      return null;
    }
  }
}
