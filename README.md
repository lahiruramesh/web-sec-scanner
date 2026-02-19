# Sylonik Monorepo

A TypeScript-based monorepo containing web crawler and security analyzer tools, managed with Turborepo and pnpm.

## 📦 Packages

- **[@sylonik/web-crawler](./packages/web-crawler)** - CLI tool to crawl websites and analyze network traffic using Playwright
- **[@sylonik/security-analyzer](./packages/security-analyzer)** - Security vulnerability analyzer for web crawler output

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

Install pnpm if you haven't already:
```bash
npm install -g pnpm
```

Install all dependencies:
```bash
pnpm install
```

## 📜 Available Scripts

### Combined Scan Command
- `pnpm scan <url> <output-file> [options]` - Run both crawler and analyzer in one command

### Global Scripts
- `pnpm build` - Build all packages
- `pnpm dev` - Run all packages in development mode
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all node_modules and dist folders

### Web Crawler Commands
- `pnpm crawler:dev` - Run crawler in development mode
- `pnpm crawler:build` - Build the crawler
- `pnpm crawler:start` - Run the built crawler
- `pnpm crawler:crawl` - Quick crawl command (same as dev)

### Security Analyzer Commands
- `pnpm analyzer:dev` - Run analyzer in development mode
- `pnpm analyzer:build` - Build the analyzer
- `pnpm analyzer:start` - Run the built analyzer

## 🏗️ Monorepo Structure

```
.
├── packages/
│   ├── web-crawler/          # Web crawler package
│   └── security-analyzer/    # Security analyzer package
├── output/                   # Shared output folder for both packages
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # pnpm workspace configuration
└── package.json              # Root package.json
```

## 🔧 Working with Packages

### Run a specific package

```bash
# Run web-crawler in dev mode
pnpm --filter @sylonik/web-crawler dev

# Build security-analyzer
pnpm --filter @sylonik/security-analyzer build
```

### Add dependencies

```bash
# Add to a specific package
pnpm --filter @sylonik/web-crawler add <package-name>

# Add to root (devDependencies)
pnpm add -D -w <package-name>
```

## 📝 Workflow

### Option 1: One Command (Recommended)

Run both crawler and analyzer in one command:

```bash
# Simplest - auto-generates filename (output/barrion.io.json)
pnpm scan barrion.io --skip-ai

# Specify custom filename (saved to output/barrion.json)
pnpm scan barrion.io barrion --max-pages 20 --max-depth 3 --skip-ai

# With AI analysis (requires Gemini API key)
pnpm scan barrion.io barrion --api-key your-api-key

# Full URL with options
pnpm scan https://example.com example --max-pages 10 --max-depth 2

# Combine multiple options
pnpm scan barrion.io --max-pages 20 --skip-ai --verbose
```

All output files are saved to the shared `output/` folder at the root level.

### Option 2: Manual Steps

1. **Crawl a website:**
   ```bash
   pnpm crawler:dev -- https://example.com --output output/example.json
   ```

2. **Analyze security:**
   ```bash
   pnpm analyzer:dev -- output/example.json
   ```

3. **Review reports:**
   - Console output with colored tables
   - Security report saved to `output/security-report.json`

### Quick Start Example

```bash
# Install dependencies
pnpm install

# Run a complete security scan (simplest form)
pnpm scan barrion.io --skip-ai

# Or specify a custom filename
pnpm scan barrion.io barrion --max-pages 20 --skip-ai

# With AI analysis
export GEMINI_API_KEY=your-api-key
pnpm scan barrion.io barrion
```

### Available Scan Options

**Crawler Options:**
- `--max-pages <number>` - Maximum number of pages to crawl
- `--max-depth <number>` - Maximum crawl depth
- `--timeout <ms>` - Page load timeout in milliseconds
- `--include-subdomains` - Include subdomains in crawl
- `--headful` - Show browser window (debugging)

**Analyzer Options:**
- `--skip-ai` - Run only rule-based analysis without AI
- `--api-key <key>` - Gemini API key (or set GEMINI_API_KEY env var)
- `--model <model>` - Gemini model to use (default: gemini-1.5-pro)
- `--security-output <file>` - Security report output file
- `--verbose` - Enable verbose logging

## 📚 Documentation

- [Web Crawler Documentation](./packages/web-crawler/README.md)
- [Security Analyzer Documentation](./packages/security-analyzer/README.md)

## 📝 License

MIT
