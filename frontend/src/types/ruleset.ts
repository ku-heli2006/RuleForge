export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface RuleAction {
  discountPercentage?: number;
  eligible?: boolean;
  freeShipping?: boolean;
  priorityProcessing?: boolean;
  customTags?: string[];
  message?: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: string;
  action: RuleAction;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RulesetStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type VerificationStatus = 'UNVERIFIED' | 'SAT' | 'UNSAT' | 'UNKNOWN';

export interface RulesetVersion {
  version: string;
  isDraft: boolean;
  publishedAt?: string;
  author: string;
  commitMessage: string;
  ruleCount: number;
  verificationStatus: VerificationStatus;
}

export interface Ruleset {
  id: string;
  name: string;
  description: string;
  version: string;
  status: RulesetStatus;
  isDraft: boolean;
  ruleCount: number;
  latestVerificationStatus: VerificationStatus;
  lastUpdated: string;
  createdAt: string;
  rules: Rule[];
  versions?: RulesetVersion[];
}

export interface CreateRulesetInput {
  name: string;
  description: string;
  initialRules?: Rule[];
}

export interface UpdateRulesetInput {
  name?: string;
  description?: string;
  rules?: Rule[];
  status?: RulesetStatus;
}
