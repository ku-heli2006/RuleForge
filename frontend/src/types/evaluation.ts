import { CustomerTier, Rule, RuleAction } from './ruleset';

export interface EvaluationInput {
  customerTier: CustomerTier;
  orderAmount: number;
  creditScore: number;
  customerAge: number;
  region: string;
  isFirstOrder: boolean;
}

export interface EvaluationTraceStep {
  ruleId: string;
  ruleName: string;
  priority: number;
  conditionEvaluated: boolean;
  conditionExpression: string;
  reason: string;
  actionApplied?: RuleAction;
}

export interface EvaluationResult {
  rulesetId: string;
  rulesetVersion: string;
  eligible: boolean;
  discountPercentage: number;
  appliedActions: RuleAction;
  matchedRules: Rule[];
  unmatchedRules: {
    rule: Rule;
    failedPredicate: string;
  }[];
  trace: EvaluationTraceStep[];
  reasons: string[];
  evaluationDurationMs: number;
  evaluatedAt: string;
}

export interface EvaluateRequest {
  rulesetId: string;
  version?: string;
  input: EvaluationInput;
}
