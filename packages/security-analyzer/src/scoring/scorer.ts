import type { CategoryAnalysis, RiskLevel, SecurityIssue } from '../types/security';
import { SEVERITY_PENALTIES, CATEGORY_WEIGHTS } from './weights';

export class SecurityScorer {
  calculateCategoryScore(issues: SecurityIssue[]): number {
    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + SEVERITY_PENALTIES[issue.severity];
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  }

  calculateOverallScore(categoryAnalyses: CategoryAnalysis[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const analysis of categoryAnalyses) {
      const weight = CATEGORY_WEIGHTS[analysis.category];
      weightedSum += analysis.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  determineRiskLevel(score: number): RiskLevel {
    if (score >= 90) return 'Low Risk';
    if (score >= 70) return 'Medium Risk';
    if (score >= 40) return 'High Risk';
    return 'Critical Risk';
  }

  summarizeIssues(categoryAnalyses: CategoryAnalysis[]) {
    const allIssues = categoryAnalyses.flatMap((ca) => ca.issues);

    return {
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter((i) => i.severity === 'critical').length,
      highIssues: allIssues.filter((i) => i.severity === 'high').length,
      mediumIssues: allIssues.filter((i) => i.severity === 'medium').length,
      lowIssues: allIssues.filter((i) => i.severity === 'low').length,
    };
  }
}
