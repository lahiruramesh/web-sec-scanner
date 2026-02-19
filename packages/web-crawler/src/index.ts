#!/usr/bin/env node

import ora from 'ora';
import { ArgsParser } from './cli/args-parser';
import { OutputFormatter } from './cli/output-formatter';
import { Crawler } from './crawler/crawler';
import { DataCollector } from './network/data-collector';
import { FileWriter } from './utils/file-writer';
import { Logger } from './utils/logger';

async function main(): Promise<void> {
  const config = ArgsParser.parseWithErrorHandling(process.argv);

  if (!config) {
    process.exit(1);
  }

  console.log('\n');
  Logger.info(`Starting crawl from: ${config.startUrl}`);

  if (config.maxPages) {
    Logger.info(`Max pages: ${config.maxPages}`);
  }
  if (config.maxDepth !== undefined) {
    Logger.info(`Max depth: ${config.maxDepth}`);
  }
  Logger.info(`Timeout: ${config.timeout}ms`);
  console.log('\n');

  const crawler = new Crawler(config);
  const startTime = Date.now();

  const spinner = ora('Initializing crawler...').start();

  try {
    // TODO: Remove setInterval and use events
    const progressInterval = setInterval(() => {
      const progress = crawler.getProgress();
      spinner.text = `Crawling... | Processed: ${progress.processed} | Queued: ${progress.queued} | Visited: ${progress.visited}`;
    }, 500);

    const pageResults = await crawler.crawl();

    clearInterval(progressInterval);
    spinner.succeed('Crawling completed!');

    const crawlResult = DataCollector.buildCrawlResult(
      config.startUrl,
      startTime,
      pageResults
    );

    OutputFormatter.displayConsoleOutput(crawlResult);

    if (crawlResult.failedPages > 0) {
      OutputFormatter.displayErrors(crawlResult);
    }

    const outputFile =
      config.outputFile || FileWriter.generateDefaultFilename();
    await FileWriter.writeCrawlResult(crawlResult, outputFile);

    console.log('\n');
  } catch (error) {
    spinner.fail('Crawl failed!');
    throw error;
  }
}

main().catch((error) => {
  Logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
