import { EvaluationInput } from './evaluation';
import { CustomerTier } from './ruleset';

export interface TargetOutcomeCondition {
  field: 'discountPercentage' | 'eligible' | 'freeShipping';
  operator: '==' | '>=' | '>' | '<=' | '<';
  targetValue: number | boolean | string;
}

export interface CounterfactualFieldChange {
  field: keyof EvaluationInput;
  fieldLabel: string;
  originalValue: string | number | boolean;
  proposedValue: string | number | boolean;
  deltaDescription: string;
  cost: number;
}

export interface CounterfactualExplanation {
  id: string;
  rank: number;
  changedFields: CounterfactualFieldChange[];
  totalCost: number;
  simulatedInput: EvaluationInput;
  simulatedOutcome: {
    eligible: boolean;
    discountPercentage: number;
    freeShipping?: boolean;
  };
  responsibleRuleIds: string[];
  explanation: string;
  isProvenOptimal: boolean; // True ONLY if formal solver proved minimal distance
  searchStatus: 'SUCCESS_OPTIMAL' | 'SUCCESS_HEURISTIC' | 'APPROXIMATE' | 'LIMIT_EXCEEDED';
  solverLimitations?: string;
}

export interface CounterfactualRequest {
  rulesetId: string;
  version?: string;
  originalInput: EvaluationInput;
  targetOutcome: TargetOutcomeCondition;
  maxSearchCost?: number;
}

export interface CounterfactualResponse {
  rulesetId: string;
  version: string;
  originalInput: EvaluationInput;
  originalOutcome: {
    eligible: boolean;
    discountPercentage: number;
    freeShipping?: boolean;
  };
  targetOutcome: TargetOutcomeCondition;
  explanations: CounterfactualExplanation[];
  isOptimalityProven: boolean;
  searchDurationMs: number;
  solver: string;
  generatedAt: string;
}
