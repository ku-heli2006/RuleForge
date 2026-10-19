export type VerificationFindingType = 'OVERLAP' | 'CONFLICT' | 'UNREACHABLE' | 'SHADOWED';

export type SolverResultStatus = 'SAT' | 'UNSAT' | 'UNKNOWN';

export type FindingSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface FindingWitness {
  customerTier?: string;
  orderAmount?: number;
  creditScore?: number;
  customerAge?: number;
  region?: string;
  isFirstOrder?: boolean;
  [key: string]: unknown;
}

export interface VerificationFinding {
  id: string;
  type: VerificationFindingType;
  ruleIds: string[];
  solverResult: SolverResultStatus;
  severity: FindingSeverity;
  explanation: string;
  witnessInput?: FindingWitness;
  runId?: string;
  timestamp: string;
  details?: {
    conditions: {
      ruleId: string;
      condition: string;
    }[];
    actions: {
      ruleId: string;
      action: Record<string, unknown>;
    }[];
    assumptions?: string[];
    solverDiagnostics?: string[];
    suggestedResolution?: string;
  };
}

export interface VerificationSummary {
  totalFindings: number;
  overlapCount: number;
  conflictCount: number;
  unreachableCount: number;
  shadowedCount: number;
}

export interface VerificationRequest {
  rulesetId: string;
  version?: string;
  options?: {
    checkOverlap?: boolean;
    checkConflict?: boolean;
    checkUnreachable?: boolean;
    checkShadowed?: boolean;
    solverTimeoutMs?: number;
    logicProfile?: string;
  };
}

export interface VerificationResponse {
  rulesetId: string;
  version: string;
  solver: string; // e.g. "Z3 4.12.2"
  solverStatus: SolverResultStatus;
  findings: VerificationFinding[];
  summary: VerificationSummary;
  verificationDurationMs: number;
  runId: string;
  timestamp: string;
}
