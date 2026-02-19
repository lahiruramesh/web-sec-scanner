# Security Analyzer

Security vulnerability analyzer for web crawler output. Combines rule-based security checks with AI-powered analysis using Google's Gemini API.

## Features

- **Rule-based Analysis**: Security headers, SSL/TLS, HTTP status, sensitive data exposure
- **AI-Powered Insights**: Contextual analysis using Google Gemini
- **Scoring System**: 0-100 security score with severity-based penalties
- **Detailed Reports**: Console output + JSON file

## Installation

```bash
cd security-analyzer
pnpm install
```

## Usage

### Basic Usage

```bash
pnpm run dev -- <input-file>
```

### With API Key

```bash
export GEMINI_API_KEY="your-api-key"
pnpm run dev -- ../output/crawl-result.json
```

Or:

```bash
pnpm run dev -- ../output/crawl-result.json --api-key "your-key"
```

### Options

- `--api-key <key>` - Gemini API key (or set GEMINI_API_KEY env var)
- `--model <model>` - Gemini model (default: gemini-1.5-pro)
- `--output <file>` - JSON output path (default: security-report.json)
- `--skip-ai` - Run only rule-based analysis
- `--verbose` - Enable detailed logging

### Examples

```bash
pnpm run dev -- crawl.json --verbose
pnpm run dev -- crawl.json --skip-ai
pnpm run dev -- crawl.json --output report.json
```

## Build

```bash
pnpm run build
pnpm start -- ../output/crawl-result.json
```

## Security Categories

1. **Security Headers** (30% weight)
   - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.

2. **SSL/TLS** (35% weight)
   - HTTPS enforcement, mixed content, secure redirects

3. **Sensitive Data** (20% weight)
   - API endpoints, admin paths, debug endpoints, version control exposure

4. **HTTP Status** (15% weight)
   - Broken links, server errors, redirect chains

## Scoring

- **90-100**: Low Risk
- **70-89**: Medium Risk
- **40-69**: High Risk
- **0-39**: Critical Risk

## License

MIT
