# Quick Start Guide

## Security Analyzer Quick Start

### 1. Install Dependencies

```bash
cd security-analyzer
npm install
```

### 2. Run Analysis (Without AI)

```bash
npm run dev -- ../output/crawl-2026-02-19T09-52-16.json --skip-ai
```

This will:
- Analyze the crawl data for security issues
- Display a colored console report
- Save `security-report.json` with detailed findings

### 3. Run Analysis (With AI)

First, set your Gemini API key:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

Then run:

```bash
npm run dev -- ../output/crawl-2026-02-19T09-52-16.json --verbose
```

This will:
- Run all rule-based security checks
- Send condensed data to Gemini for AI-powered insights
- Discover additional security issues
- Provide prioritized recommendations

### 4. Custom Output Location

```bash
npm run dev -- ../output/crawl-data.json --output my-report.json
```

### 5. Production Build

```bash
npm run build
npm start -- ../output/crawl-data.json
```

## Example Output

```
Security Analysis Report
════════════════════════════════════════════════════════════

Overall Score: 81/100 (MEDIUM RISK)
Analyzed: https://example.com
Pages: 6 | Requests: 327

┌─────────────────────────┬──────────┬──────────┬──────────┬────────────┐
│ Category                │ Score    │ Issues   │ Passed   │ Warnings   │
├─────────────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Security Headers        │ 48       │ 6        │ 15       │ 2          │
├─────────────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Ssl Tls                 │ 100      │ 0        │ 8        │ 0          │
├─────────────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Http Status             │ 100      │ 0        │ 2        │ 0          │
├─────────────────────────┼──────────┼──────────┼──────────┼────────────┤
│ Sensitive Data          │ 84       │ 2        │ 5        │ 2          │
└─────────────────────────┴──────────┴──────────┴──────────┴────────────┘

Critical Issues (2)
────────────────────────────────────────────────────────────
✗ Missing content-security-policy header
  Severity: HIGH | CWE-693
  Affects: 6 pages
  → Implement CSP with strict directives to prevent XSS attacks
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy your API key
5. Set it as an environment variable:
   ```bash
   export GEMINI_API_KEY="your-key"
   ```

## Common Options

- `--skip-ai` - Skip AI analysis (faster, no API key needed)
- `--verbose` - Show detailed logging during analysis
- `--model gemini-1.5-flash` - Use faster/cheaper model
- `--output report.json` - Customize output file location

## Troubleshooting

**"File not found" error:**
- Check that the crawl JSON file path is correct
- Use absolute or relative path from security-analyzer directory

**"Gemini API error":**
- Verify your API key is set correctly
- Check your API quota/billing
- Use `--skip-ai` to bypass AI analysis

**Invalid JSON errors:**
- Ensure the input file is valid JSON
- Verify it matches the CrawlResult schema
- Check that the crawler completed successfully

## Next Steps

- Review the generated `security-report.json`
- Fix high/critical severity issues first
- Re-run analysis after implementing fixes
- Compare scores over time
