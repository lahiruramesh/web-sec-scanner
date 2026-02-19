#!/usr/bin/env node

import ora from 'ora';
import { parseArgs } from './cli/args-parser';
import { OutputFormatter } from './cli/output-formatter';
import { Logger } from './utils/logger';
import { loadCrawlResult } from './utils/file-reader';
import { SecurityHeadersAnalyzer } from './analyzers/security-headers';
import { SSLTLSAnalyzer } from './analyzers/ssl-tls';
import { HTTPStatusAnalyzer } from './analyzers/http-status';
import { SensitiveDataAnalyzer } from './analyzers/sensitive-data';
import { SecurityScorer } from './scoring/scorer';
import { GeminiClient } from './ai/gemini-client';
import { PromptBuilder } from './ai/prompt-builder';
import { ResponseParser } from './ai/response-parser';
import type { SecurityReport, CategoryAnalysis } from './types/security';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../..');

async function main() {
  const options = parseArgs();
  const logger = new Logger(options.verbose);

  try {
    logger.info('Loading crawl data...');
    const crawlData = await loadCrawlResult(options.inputFile);
    logger.success(`Loaded ${crawlData.totalPages} pages from ${options.inputFile}`);

    const spinner = ora('Running security analyzers...').start();

    // TODO: Add strategy pattern or command partern
    logger.debug('Running Security Headers Analyzer');
    const securityHeadersAnalyzer = new SecurityHeadersAnalyzer(crawlData);
    const headersResult = await securityHeadersAnalyzer.analyze();

    logger.debug('Running SSL/TLS Analyzer');
    const sslTlsAnalyzer = new SSLTLSAnalyzer(crawlData);
    const sslResult = await sslTlsAnalyzer.analyze();

    logger.debug('Running HTTP Status Analyzer');
    const httpStatusAnalyzer = new HTTPStatusAnalyzer(crawlData);
    const httpResult = await httpStatusAnalyzer.analyze();

    logger.debug('Running Sensitive Data Analyzer');
    const sensitiveDataAnalyzer = new SensitiveDataAnalyzer(crawlData);
    const sensitiveResult = await sensitiveDataAnalyzer.analyze();

    spinner.succeed('Security analysis completed');

    const scorer = new SecurityScorer();
    const categoryAnalyses: CategoryAnalysis[] = [
      {
        category: 'security-headers',
        score: scorer.calculateCategoryScore(headersResult.issues),
        issues: headersResult.issues,
        passed: headersResult.passed,
        failed: headersResult.failed,
        warnings: headersResult.warnings,
      },
      {
        category: 'ssl-tls',
        score: scorer.calculateCategoryScore(sslResult.issues),
        issues: sslResult.issues,
        passed: sslResult.passed,
        failed: sslResult.failed,
        warnings: sslResult.warnings,
      },
      {
        category: 'http-status',
        score: scorer.calculateCategoryScore(httpResult.issues),
        issues: httpResult.issues,
        passed: httpResult.passed,
        failed: httpResult.failed,
        warnings: httpResult.warnings,
      },
      {
        category: 'sensitive-data',
        score: scorer.calculateCategoryScore(sensitiveResult.issues),
        issues: sensitiveResult.issues,
        passed: sensitiveResult.passed,
        failed: sensitiveResult.failed,
        warnings: sensitiveResult.warnings,
      },
    ];

    let aiAnalysis;

    if (!options.skipAi && options.apiKey) {
      const aiSpinner = ora('Running AI-powered analysis...').start();

      try {
        const geminiClient = new GeminiClient(options.apiKey, options.model);
        const promptBuilder = new PromptBuilder();
        const responseParser = new ResponseParser();

        const prompt = promptBuilder.buildAnalysisPrompt(crawlData, categoryAnalyses);
        logger.debug('Sending prompt to Gemini API');

        const aiResponse = await geminiClient.analyze(prompt);
        aiAnalysis = responseParser.parseAIResponse(aiResponse);

        if (aiAnalysis.additionalIssues.length > 0) {
          for (const issue of aiAnalysis.additionalIssues) {
            const categoryAnalysis = categoryAnalyses.find(
              (ca) => ca.category === issue.category
            );
            if (categoryAnalysis) {
              categoryAnalysis.issues.push(issue);
              categoryAnalysis.score = scorer.calculateCategoryScore(categoryAnalysis.issues);
            }
          }
        }

        aiSpinner.succeed('AI analysis completed');
      } catch (error) {
        aiSpinner.fail('AI analysis failed');
        logger.warn(
          `AI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        logger.info('Continuing with rule-based analysis only');
      }
    }

    const overallScore = scorer.calculateOverallScore(categoryAnalyses);
    const riskLevel = scorer.determineRiskLevel(overallScore);
    const summary = scorer.summarizeIssues(categoryAnalyses);

    const report: SecurityReport = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        sourceFile: options.inputFile,
        crawlStartUrl: crawlData.startUrl,
        totalPagesAnalyzed: crawlData.totalPages,
        totalRequestsAnalyzed: crawlData.summary.totalRequests,
      },
      overallScore,
      riskLevel,
      categoryAnalyses,
      aiAnalysis,
      summary,
    };

    const formatter = new OutputFormatter();
    formatter.formatConsoleReport(report);

    if (options.output) {
      const outputPath = resolve(options.output);
      await formatter.writeJSONReport(report, outputPath);
      logger.success(`JSON report saved to ${outputPath}`);
    } else {
      const defaultOutput = resolve(rootDir, 'output/security-report.json');
      await formatter.writeJSONReport(report, defaultOutput);
      logger.success(`JSON report saved to ${defaultOutput}`);
    }

  } catch (error) {
    logger.error(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

main();
