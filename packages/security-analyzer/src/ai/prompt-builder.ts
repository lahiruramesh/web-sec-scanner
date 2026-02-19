import type { CrawlResult, CategoryAnalysis } from '../types/security';

export class PromptBuilder {
  buildAnalysisPrompt(
    crawlData: CrawlResult,
    categoryAnalyses: CategoryAnalysis[]
  ): string {
    const condensedData = this.condenseCrawlData(crawlData);
    const ruleBasedFindings = this.formatFindings(categoryAnalyses);

    return `You are an expert web security analyst with deep knowledge of OWASP Top 10, penetration testing, and security best practices.

CONTEXT:
- Analyzed website: ${crawlData.startUrl}
- Total pages crawled: ${crawlData.totalPages}
- Total requests: ${crawlData.summary.totalRequests}
- Rule-based analysis found ${this.countTotalIssues(categoryAnalyses)} issues

CONDENSED CRAWL DATA:
${condensedData}

RULE-BASED FINDINGS:
${ruleBasedFindings}

TASK:
1. Identify security issues NOT caught by the rule-based analyzers
2. Assess the overall security posture of the website
3. Provide a comprehensive risk assessment
4. Prioritize the top 5 most critical recommendations

OUTPUT FORMAT (JSON only, no markdown):
{
  "insights": [
    "string - contextual security insight not covered by rules"
  ],
  "additionalIssues": [
    {
      "category": "security-headers" | "ssl-tls" | "http-status" | "sensitive-data",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "string",
      "description": "string",
      "affectedUrls": ["string"],
      "recommendation": "string",
      "cweId": "string (optional)",
      "evidence": "string (optional)"
    }
  ],
  "riskAssessment": "string - comprehensive 2-3 sentence assessment",
  "priorityRecommendations": [
    "string - top 5 actionable recommendations in priority order"
  ]
}

Provide ONLY the JSON output, no additional text.`;
  }

  private condenseCrawlData(crawlData: CrawlResult): string {
    const samplePages = crawlData.pages.slice(0, 5);

    const summary = {
      totalPages: crawlData.totalPages,
      successfulPages: crawlData.successfulPages,
      failedPages: crawlData.failedPages,
      uniqueDomains: crawlData.summary.uniqueDomains,
      statusCodeDistribution: crawlData.summary.statusCodes,
    };

    const securityRelevantData = {
      httpPages: crawlData.pages.filter((p) => p.url.startsWith('http://')).length,
      httpsPages: crawlData.pages.filter((p) => p.url.startsWith('https://')).length,
      samplePages: samplePages.map((page) => ({
        url: page.url,
        hasError: !!page.error,
        requestCount: page.requests.length,
        sampleHeaders: page.responses[0]?.headers || {},
      })),
    };

    return JSON.stringify({ summary, securityRelevantData }, null, 2);
  }

  private formatFindings(categoryAnalyses: CategoryAnalysis[]): string {
    let output = '';

    for (const analysis of categoryAnalyses) {
      output += `\n${analysis.category.toUpperCase()}:\n`;
      output += `  Score: ${analysis.score}/100\n`;
      output += `  Issues: ${analysis.issues.length}\n`;

      if (analysis.issues.length > 0) {
        for (const issue of analysis.issues.slice(0, 5)) {
          output += `  - [${issue.severity.toUpperCase()}] ${issue.title}\n`;
          output += `    ${issue.description}\n`;
        }
      }
    }

    return output;
  }

  private countTotalIssues(categoryAnalyses: CategoryAnalysis[]): number {
    return categoryAnalyses.reduce((sum, ca) => sum + ca.issues.length, 0);
  }
}
