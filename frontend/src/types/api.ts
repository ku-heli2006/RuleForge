export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: Record<string, unknown> | string[];
}

export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  version: string;
  solver: {
    name: string;
    version: string;
    available: boolean;
  };
  uptimeSeconds: number;
  timestamp: string;
}

export interface ValidationErrorItem {
  ruleId?: string;
  field?: string;
  message: string;
  line?: number;
  severity: 'ERROR' | 'WARNING';
}

export interface RuleValidationResponse {
  valid: boolean;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  parsedRulesCount: number;
}
