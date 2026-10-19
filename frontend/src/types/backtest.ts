export interface ChangedRecord {
  recordId: string;
  customerTier: string;
  orderAmount: number;
  creditScore: number;
  region: string;
  baselineOutcome: {
    eligible: boolean;
    discountPercentage: number;
  };
  candidateOutcome: {
    eligible: boolean;
    discountPercentage: number;
  };
  netDiscountDifference: number; // e.g. +5% or -10%
  dollarImpact: number; // calculated e.g. +$25.00
  deltaReason: string;
  triggeringRules: {
    baselineRuleIds: string[];
    candidateRuleIds: string[];
  };
}

export interface TierImpact {
  tier: string;
  totalRecords: number;
  changedCount: number;
  avgDiscountBaseline: number;
  avgDiscountCandidate: number;
  netFinancialDelta: number;
}

export interface RegionImpact {
  region: string;
  totalRecords: number;
  changedCount: number;
  netFinancialDelta: number;
}

export interface BacktestJob {
  id: string;
  rulesetId: string;
  baselineVersion: string;
  candidateVersion: string;
  datasetId: string;
  datasetName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  totalRecords: number;
  changedDecisions: number;
  unchangedDecisions: number;
  percentageChanged: number;
  estimatedFinancialImpact: number; // Dollar impact, positive means higher discount cost
  outcomeDistributions: {
    baseline: {
      zeroDiscount: number;
      tier5to10: number;
      tier10to20: number;
      tier20Plus: number;
      ineligible: number;
    };
    candidate: {
      zeroDiscount: number;
      tier5to10: number;
      tier10to20: number;
      tier20Plus: number;
      ineligible: number;
    };
  };
  tierBreakdown: TierImpact[];
  regionBreakdown: RegionImpact[];
  changedRecords: ChangedRecord[];
  warnings: string[];
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface BacktestRequest {
  rulesetId: string;
  baselineVersion: string;
  candidateVersion: string;
  datasetId: string;
  segmentFilters?: {
    region?: string;
    customerTier?: string;
  };
}
