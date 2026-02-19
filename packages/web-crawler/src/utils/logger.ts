import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  static success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  static error(message: string): void {
    console.error(chalk.red(`✗ ${message}`));
  }

  static log(message: string): void {
    console.log(message);
  }

  static custom(message: string, color: 'cyan' | 'magenta' | 'gray'): void {
    console.log(chalk[color](message));
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString();
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  }
}
