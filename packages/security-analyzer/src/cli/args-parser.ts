import { Command } from 'commander';

export interface CLIOptions {
  inputFile: string;
  apiKey?: string;
  model: string;
  output?: string;
  skipAi: boolean;
  verbose: boolean;
}

export function parseArgs(): CLIOptions {
  const program = new Command();

  program
    .name('security-analyzer')
    .description('Security vulnerability analyzer for web crawler output')
    .version('1.0.0')
    .argument('<input-file>', 'Path to crawler JSON output file')
    .option('--api-key <key>', 'Gemini API key (or set GEMINI_API_KEY env var)')
    .option('--model <model>', 'Gemini model to use', 'gemini-pro')
    .option('--output <file>', 'JSON output file path')
    .option('--skip-ai', 'Run only rule-based analysis without AI', false)
    .option('--verbose', 'Enable verbose logging', false)
    .parse();

  const inputFile = program.args[0];
  const options = program.opts();

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (!options.skipAi && !apiKey) {
    console.error('Error: Gemini API key required. Set --api-key or GEMINI_API_KEY environment variable.');
    console.error('Alternatively, use --skip-ai to run without AI analysis.');
    process.exit(1);
  }

  return {
    inputFile,
    apiKey,
    model: options.model,
    output: options.output,
    skipAi: options.skipAi,
    verbose: options.verbose,
  };
}
