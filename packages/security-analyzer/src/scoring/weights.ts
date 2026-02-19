import type { SeverityLevel, SecurityCategory } from '../types/security';

export const SEVERITY_PENALTIES: Record<SeverityLevel, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

export const CATEGORY_WEIGHTS: Record<SecurityCategory, number> = {
  'ssl-tls': 0.35,
  'security-headers': 0.30,
  'sensitive-data': 0.20,
  'http-status': 0.15,
};
