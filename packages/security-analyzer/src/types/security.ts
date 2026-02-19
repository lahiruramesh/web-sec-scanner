export interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  resourceType: string;
}

export interface ResponseData {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: number;
  bodySize?: number;
  contentType?: string;
  redirected: boolean;
  fromCache: boolean;
}

export interface PageResult {
  url: string;
  depth: number;
  timestamp: number;
  loadTime: number;
  requests: RequestData[];
  responses: ResponseData[];
  links: string[];
  error?: string;
}

export interface CrawlSummary {
  totalRequests: number;
  totalResponses: number;
  statusCodes: Record<number, number>;
  uniqueDomains: string[];
}

export interface CrawlResult {
  startUrl: string;
  startTime: number;
  endTime: number;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  pages: PageResult[];
  summary: CrawlSummary;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecurityCategory =
  | 'security-headers'
  | 'ssl-tls'
  | 'http-status'
  | 'sensitive-data';

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk';

export interface SecurityIssue {
  category: SecurityCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  affectedUrls: string[];
  recommendation: string;
  cweId?: string;
  evidence?: string;
}

export interface CategoryAnalysis {
  category: SecurityCategory;
  score: number;
  issues: SecurityIssue[];
  passed: number;
  failed: number;
  warnings: number;
}

export interface AIAnalysis {
  insights: string[];
  additionalIssues: SecurityIssue[];
  riskAssessment: string;
  priorityRecommendations: string[];
}

export interface SecurityReport {
  metadata: {
    analyzedAt: string;
    sourceFile: string;
    crawlStartUrl: string;
    totalPagesAnalyzed: number;
    totalRequestsAnalyzed: number;
  };
  overallScore: number;
  riskLevel: RiskLevel;
  categoryAnalyses: CategoryAnalysis[];
  aiAnalysis?: AIAnalysis;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

export interface AnalyzerResult {
  category: SecurityCategory;
  issues: SecurityIssue[];
  passed: number;
  failed: number;
  warnings: number;
}
