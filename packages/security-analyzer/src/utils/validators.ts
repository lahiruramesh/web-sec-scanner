import { z } from 'zod';
import type { AIAnalysis, SecurityIssue } from '../types/security';

const SecurityIssueSchema = z.object({
  category: z.enum(['security-headers', 'ssl-tls', 'http-status', 'sensitive-data']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  title: z.string(),
  description: z.string(),
  affectedUrls: z.array(z.string()),
  recommendation: z.string(),
  cweId: z.string().optional(),
  evidence: z.string().optional(),
});

const AIAnalysisSchema = z.object({
  insights: z.array(z.string()),
  additionalIssues: z.array(SecurityIssueSchema),
  riskAssessment: z.string(),
  priorityRecommendations: z.array(z.string()),
});

export function validateAIResponse(response: unknown): AIAnalysis {
  return AIAnalysisSchema.parse(response);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
