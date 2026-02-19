#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function printUsage() {
  console.log(`
Usage: pnpm scan <url> [output-file] [options]

Arguments:
  url           URL to crawl (will add https:// if protocol is missing)
  output-file   Output file path (optional, defaults to output/<domain>.json)
                Can be just a filename (e.g., "scan" → "output/scan.json")
                Or a full path (e.g., "output/mysite.json")

Crawler Options:
  --max-pages <number>      Maximum number of pages to crawl
  --max-depth <number>      Maximum crawl depth
  --timeout <ms>            Page load timeout in milliseconds
  --include-subdomains      Include subdomains in crawl
  --headful                 Show browser window

Analyzer Options:
  --skip-ai                 Run only rule-based analysis without AI
  --api-key <key>           Gemini API key (or set GEMINI_API_KEY env var)
  --model <model>           Gemini model to use (default: gemini-1.5-pro)
  --security-output <file>  Security report output file (default: output/security-report.json)
  --verbose                 Enable verbose logging

Examples:
  # Simplest form - auto-generates output filename
  pnpm scan barrion.io --skip-ai

  # Specify output filename (will be saved in output/)
  pnpm scan barrion.io barrion --max-pages 10 --skip-ai

  # Full path
  pnpm scan https://example.com output/example.json --max-depth 2

  # With AI analysis
  pnpm scan barrion.io --api-key your-key --max-pages 20
`);
}

function normalizeUrl(url) {
  // Add https:// if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

function ensureJsonExtension(filepath) {
  // Add .json extension if not present
  if (!filepath.endsWith('.json')) {
    return `${filepath}.json`;
  }
  return filepath;
}

function generateOutputPath(url, providedPath) {
  // If a path is provided, use it (ensuring it's in output/ and has .json)
  if (providedPath) {
    let path = providedPath;

    // If it's just a filename without directory, put it in output/
    if (!path.includes('/')) {
      path = `output/${path}`;
    }

    return ensureJsonExtension(path);
  }

  // Auto-generate filename from URL
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    return `output/${domain}.json`;
  } catch {
    return 'output/scan.json';
  }
}

function runCommand(command, args, description) {
  return new Promise((resolvePromise, rejectPromise) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${description}`);
    console.log(`${'='.repeat(60)}\n`);

    const rootDir = resolve(__dirname, '..');
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: rootDir
    });

    child.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`${description} failed with exit code ${code}`));
      } else {
        resolvePromise();
      }
    });

    child.on('error', (error) => {
      rejectPromise(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  let url = args[0];
  let outputFileArg = null;
  let additionalArgs = [];

  // Check if second argument is a filename or an option
  if (args.length > 1 && !args[1].startsWith('--')) {
    outputFileArg = args[1];
    additionalArgs = args.slice(2);
  } else {
    additionalArgs = args.slice(1);
  }

  // Normalize URL and generate output file path
  url = normalizeUrl(url);
  const outputFile = generateOutputPath(url, outputFileArg);

  console.log(`\n🌐 Target URL: ${url}`);
  console.log(`📁 Output file: ${outputFile}\n`);

  // Separate crawler and analyzer options
  const crawlerArgs = [url, '--output', outputFile];
  const analyzerArgs = [outputFile];

  let i = 0;
  while (i < additionalArgs.length) {
    const arg = additionalArgs[i];

    // Crawler-specific options
    if (arg === '--max-pages' || arg === '--max-depth' || arg === '--timeout') {
      if (i + 1 >= additionalArgs.length) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      crawlerArgs.push(arg, additionalArgs[i + 1]);
      i += 2;
    } else if (arg === '--include-subdomains' || arg === '--headful') {
      crawlerArgs.push(arg);
      i += 1;
    }
    // Analyzer-specific options
    else if (arg === '--skip-ai' || arg === '--verbose') {
      analyzerArgs.push(arg);
      i += 1;
    } else if (arg === '--api-key' || arg === '--model') {
      if (i + 1 >= additionalArgs.length) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      analyzerArgs.push(arg, additionalArgs[i + 1]);
      i += 2;
    } else if (arg === '--security-output') {
      if (i + 1 >= additionalArgs.length) {
        console.error(`Error: ${arg} requires a value`);
        process.exit(1);
      }
      analyzerArgs.push('--output', additionalArgs[i + 1]);
      i += 2;
    } else {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  try {
    // Convert output file to absolute path
    const absoluteOutputFile = resolve(outputFile);

    // Step 1: Run crawler (using absolute path)
    const crawlerCommand = ['--filter', '@sylonik/web-crawler', 'dev'];
    const crawlerArgsWithAbsPath = [url, '--output', absoluteOutputFile, ...crawlerArgs.slice(3)];
    const fullCrawlerArgs = [...crawlerCommand, ...crawlerArgsWithAbsPath];

    await runCommand(
      'pnpm',
      fullCrawlerArgs,
      '📡 STEP 1: Running Web Crawler'
    );

    // Step 2: Run security analyzer (using absolute path)
    const analyzerCommand = ['--filter', '@sylonik/security-analyzer', 'dev'];
    const analyzerArgsWithAbsPath = [absoluteOutputFile, ...analyzerArgs.slice(1)];
    const fullAnalyzerArgs = [...analyzerCommand, ...analyzerArgsWithAbsPath];

    await runCommand(
      'pnpm',
      fullAnalyzerArgs,
      '🔒 STEP 2: Running Security Analyzer'
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Full scan completed successfully!');
    console.log(`${'='.repeat(60)}\n`);
    console.log(`📄 Crawler output: ${absoluteOutputFile}`);
    const securityOutputIndex = analyzerArgs.indexOf('--output');
    const securityOutput = securityOutputIndex !== -1
      ? resolve(analyzerArgs[securityOutputIndex + 1])
      : resolve('output/security-report.json');
    console.log(`🔒 Security report: ${securityOutput}`);
    console.log();

  } catch (error) {
    console.error(`\n❌ Scan failed: ${error.message}`);
    process.exit(1);
  }
}

main();
