# Web Crawler & Security Analyzer

A TypeScript-based web crawler with comprehensive security analysis capabilities.

## Projects

### 1. Web Crawler
TypeScript web crawler using Playwright for comprehensive website analysis.

**Location:** `/src`

**Features:**
- BFS crawling with depth control
- Network request/response tracking
- Configurable page limits
- JSON output

**Usage:**
```bash
pnpm run dev
```

### 2. Security Analyzer
AI-powered security vulnerability analyzer for web crawler output.

**Location:** `/security-analyzer`

**Features:**
- Rule-based security checks (headers, SSL/TLS, sensitive data, HTTP status)
- AI-powered insights via Google Gemini
- 0-100 security scoring with risk levels
- Detailed console reports + JSON output

**Quick Start:**
```bash
cd security-analyzer
pnpm install
pnpm run dev -- ../output/crawl-result.json --skip-ai
```

**With AI Analysis:**
```bash
export GEMINI_API_KEY="your-api-key"
pnpm run dev -- ../output/crawl-result.json
```

**See:** [security-analyzer/README.md](security-analyzer/README.md) for full documentation

## Workflow

1. **Crawl a website:**
   ```bash
   pnpm run dev
   ```

2. **Analyze security:**
   ```bash
   cd security-analyzer
   pnpm run dev -- ../output/your-crawl-file.json
   ```

3. **Review reports:**
   - Console output with colored tables
   - `security-report.json` with detailed findings

## Requirements

- Node.js 18+
- TypeScript 5+
- Gemini API key (optional, for AI analysis)

## License

MIT
