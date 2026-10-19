import { Ruleset, Rule } from '../types/ruleset';
import { EvaluationResult, EvaluationInput } from '../types/evaluation';
import { VerificationResponse } from '../types/verification';
import { CounterfactualResponse } from '../types/counterfactual';
import { BacktestJob } from '../types/backtest';

export const INITIAL_RULES: Rule[] = [
  {
    id: 'RULE-101',
    name: 'VIP Platinum High-Value Discount',
    description: 'Grant a 20% discount and free shipping to Platinum members spending over $5,000.',
    priority: 1,
    condition: 'customerTier == PLATINUM AND orderAmount > 5000',
    action: {
      discountPercentage: 20,
      eligible: true,
      freeShipping: true,
      priorityProcessing: true,
      message: 'Platinum Tier High-Value Reward applied.',
    },
    enabled: true,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-15T14:20:00Z',
  },
  {
    id: 'RULE-102',
    name: 'Gold Member Threshold Incentive',
    description: 'Grant 10% discount to Gold tier customers with order exceeding $2,500.',
    priority: 2,
    condition: 'customerTier == GOLD AND orderAmount > 2500',
    action: {
      discountPercentage: 10,
      eligible: true,
      freeShipping: false,
      message: 'Gold Member Standard Reward applied.',
    },
    enabled: true,
    createdAt: '2026-10-01T10:05:00Z',
    updatedAt: '2026-10-10T11:00:00Z',
  },
  {
    id: 'RULE-103',
    name: 'Prime Credit Loyalty Boost',
    description: 'Customers with prime credit score (>= 720) and order over $1,500 receive 15% discount.',
    priority: 3,
    condition: 'creditScore >= 720 AND orderAmount > 1500',
    action: {
      discountPercentage: 15,
      eligible: true,
      freeShipping: true,
      message: 'Prime Credit Score Booster applied.',
    },
    enabled: true,
    createdAt: '2026-10-02T09:30:00Z',
    updatedAt: '2026-10-12T16:45:00Z',
  },
  {
    id: 'RULE-104',
    name: 'First Order Welcome Bonus',
    description: 'First time buyers get 5% discount regardless of tier.',
    priority: 4,
    condition: 'isFirstOrder == true AND orderAmount >= 50',
    action: {
      discountPercentage: 5,
      eligible: true,
      freeShipping: false,
      message: 'First order welcome perk.',
    },
    enabled: true,
    createdAt: '2026-10-02T11:15:00Z',
    updatedAt: '2026-10-02T11:15:00Z',
  },
  {
    id: 'RULE-105',
    name: 'Subprime Risk Restriction',
    description: 'Ineligible for promotional discounts if credit score is below 550 and not first order.',
    priority: 5,
    condition: 'creditScore < 550 AND isFirstOrder == false',
    action: {
      discountPercentage: 0,
      eligible: false,
      message: 'Subprime restriction: Promotional discount ineligible.',
    },
    enabled: true,
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  },
  {
    id: 'RULE-106',
    name: 'Shadowed Minor Discount (Known Defect)',
    description: 'Targeted bonus for underage shoppers which is mathematically shadowed by prior default rules.',
    priority: 6,
    condition: 'customerAge < 18 AND orderAmount > 10000 AND customerTier == BRONZE',
    action: {
      discountPercentage: 2,
      eligible: true,
      message: 'Underage bonus (Unreachable due to system minimum order age constraint).',
    },
    enabled: true,
    createdAt: '2026-10-08T12:00:00Z',
    updatedAt: '2026-10-08T12:00:00Z',
  },
];

export const MOCK_RULESETS: Ruleset[] = [
  {
    id: 'rs-ecommerce-discounts',
    name: 'E-Commerce Tiered VIP & Discount Engine',
    description: 'Authoritative rules for customer eligibility, checkout tiers, loyalty multipliers, and credit score discounts.',
    version: '1.2.0',
    status: 'PUBLISHED',
    isDraft: false,
    ruleCount: 6,
    latestVerificationStatus: 'SAT', // SAT because solver found concrete witness to conflict/overlap
    lastUpdated: '2026-10-15T14:20:00Z',
    createdAt: '2026-09-20T09:00:00Z',
    rules: INITIAL_RULES,
    versions: [
      {
        version: '1.2.0',
        isDraft: false,
        publishedAt: '2026-10-15T14:20:00Z',
        author: 'lead-architect@ruleforge.io',
        commitMessage: 'Added prime credit booster and refined VIP platinum tier',
        ruleCount: 6,
        verificationStatus: 'SAT',
      },
      {
        version: '1.1.0',
        isDraft: false,
        publishedAt: '2026-10-05T08:30:00Z',
        author: 'risk-team@ruleforge.io',
        commitMessage: 'Enforced subprime risk restrictions',
        ruleCount: 5,
        verificationStatus: 'UNSAT',
      },
      {
        version: '1.0.0',
        isDraft: false,
        publishedAt: '2026-09-20T09:00:00Z',
        author: 'founder@ruleforge.io',
        commitMessage: 'Initial baseline discount rules',
        ruleCount: 4,
        verificationStatus: 'UNSAT',
      },
    ],
  },
  {
    id: 'rs-fraud-risk-gate',
    name: 'Transactional Fraud & Velocity Guard',
    description: 'Security and fraud prevention gates based on geographic anomalies and risk scoring.',
    version: '2.0.0-rc1',
    status: 'DRAFT',
    isDraft: true,
    ruleCount: 4,
    latestVerificationStatus: 'UNSAT', // UNSAT = proven no conflicting branches under checked constraints
    lastUpdated: '2026-10-18T18:10:00Z',
    createdAt: '2026-10-12T11:00:00Z',
    rules: [
      {
        id: 'FR-01',
        name: 'High Risk Geographic Flag',
        description: 'Orders from sanctioned or anomalous regions require step-up verification.',
        priority: 1,
        condition: "region == 'APAC' AND orderAmount > 8000 AND creditScore < 600",
        action: {
          eligible: false,
          discountPercentage: 0,
          message: 'Flagged for manual fraud inspection.',
        },
        enabled: true,
      },
      {
        id: 'FR-02',
        name: 'Low Risk Fast Track',
        description: 'Prime accounts with verified domestic address bypass delay.',
        priority: 2,
        condition: "creditScore >= 750 AND orderAmount <= 5000",
        action: {
          eligible: true,
          message: 'Fast track clearance approved.',
        },
        enabled: true,
      },
    ],
  },
  {
    id: 'rs-b2b-wholesale',
    name: 'B2B Corporate Wholesale Volume Matrix',
    description: 'Bulk purchase terms and contracted discount schedules for verified enterprise accounts.',
    version: '1.0.4',
    status: 'PUBLISHED',
    isDraft: false,
    ruleCount: 5,
    latestVerificationStatus: 'UNKNOWN',
    lastUpdated: '2026-10-01T15:00:00Z',
    createdAt: '2026-08-15T10:00:00Z',
    rules: [],
  },
];

export const MOCK_VERIFICATION_RESPONSE: VerificationResponse = {
  rulesetId: 'rs-ecommerce-discounts',
  version: '1.2.0',
  solver: 'Z3 SMT Solver v4.12.2 (SMT-LIB2 Logic: QF_LIA)',
  solverStatus: 'SAT', // SAT because satisfying counterexample/witness found for overlap & conflict
  runId: 'vr-run-8921-z3',
  timestamp: '2026-10-18T19:42:10Z',
  verificationDurationMs: 42,
  summary: {
    totalFindings: 3,
    overlapCount: 1,
    conflictCount: 1,
    unreachableCount: 1,
    shadowedCount: 1,
  },
  findings: [
    {
      id: 'FIND-001',
      type: 'CONFLICT',
      ruleIds: ['RULE-102', 'RULE-103'],
      solverResult: 'SAT',
      severity: 'CRITICAL',
      explanation: 'Conflicting discount outcomes: Both RULE-102 and RULE-103 can fire concurrently on overlapping inputs, producing mutually exclusive actions (10% vs 15% discount) without strict priority dominance.',
      witnessInput: {
        customerTier: 'GOLD',
        orderAmount: 3200,
        creditScore: 740,
        customerAge: 34,
        region: 'US_EAST',
        isFirstOrder: false,
      },
      timestamp: '2026-10-18T19:42:10Z',
      details: {
        conditions: [
          { ruleId: 'RULE-102', condition: 'customerTier == GOLD AND orderAmount > 2500' },
          { ruleId: 'RULE-103', condition: 'creditScore >= 720 AND orderAmount > 1500' },
        ],
        actions: [
          { ruleId: 'RULE-102', action: { discountPercentage: 10, freeShipping: false } },
          { ruleId: 'RULE-103', action: { discountPercentage: 15, freeShipping: true } },
        ],
        assumptions: [
          'orderAmount: Integer [0..1000000]',
          'creditScore: Integer [300..850]',
          'customerTier in {BRONZE, SILVER, GOLD, PLATINUM}',
        ],
        solverDiagnostics: [
          '(assert (and (= customerTier 2) (> orderAmount 2500))) ; RULE-102',
          '(assert (and (>= creditScore 720) (> orderAmount 1500))) ; RULE-103',
          'Z3 check-sat: sat',
          'Model extracted: [customerTier -> 2 (GOLD), orderAmount -> 3200, creditScore -> 740]',
        ],
        suggestedResolution: 'Introduce explicit priority disambiguation or partition the condition predicate (e.g., exclude GOLD tier from RULE-103, or stipulate priority order explicitly).',
      },
    },
    {
      id: 'FIND-002',
      type: 'OVERLAP',
      ruleIds: ['RULE-101', 'RULE-103'],
      solverResult: 'SAT',
      severity: 'WARNING',
      explanation: 'Condition overlap detected: When a Platinum customer with creditScore >= 720 spends over $5000, both RULE-101 and RULE-103 match. Although RULE-101 has higher priority (priority 1 vs 3), an overlap exists across valid states.',
      witnessInput: {
        customerTier: 'PLATINUM',
        orderAmount: 6000,
        creditScore: 780,
        customerAge: 42,
        region: 'EU_WEST',
        isFirstOrder: false,
      },
      timestamp: '2026-10-18T19:42:10Z',
      details: {
        conditions: [
          { ruleId: 'RULE-101', condition: 'customerTier == PLATINUM AND orderAmount > 5000' },
          { ruleId: 'RULE-103', condition: 'creditScore >= 720 AND orderAmount > 1500' },
        ],
        actions: [
          { ruleId: 'RULE-101', action: { discountPercentage: 20 } },
          { ruleId: 'RULE-103', action: { discountPercentage: 15 } },
        ],
        assumptions: ['Valid customer domain'],
        solverDiagnostics: [
          'Overlap is resolvable by priority order (RULE-101 priority 1 overrides RULE-103 priority 3).',
        ],
        suggestedResolution: 'If intentional, no change required as priority order guarantees deterministic execution. Otherwise, make condition mutually exclusive.',
      },
    },
    {
      id: 'FIND-003',
      type: 'UNREACHABLE',
      ruleIds: ['RULE-106'],
      solverResult: 'UNSAT',
      severity: 'WARNING',
      explanation: 'Unreachable rule: RULE-106 requires customerAge < 18 AND orderAmount > 10000 AND customerTier == BRONZE. Under domain axioms where underage accounts cannot hold independent high-order limits, the rule condition cannot be satisfied.',
      timestamp: '2026-10-18T19:42:10Z',
      details: {
        conditions: [
          { ruleId: 'RULE-106', condition: 'customerAge < 18 AND orderAmount > 10000 AND customerTier == BRONZE' },
        ],
        actions: [
          { ruleId: 'RULE-106', action: { discountPercentage: 2 } },
        ],
        assumptions: [
          'Domain axiom: customerAge < 18 implies max orderAmount <= 500',
        ],
        solverDiagnostics: [
          '(assert (< customerAge 18))',
          '(assert (> orderAmount 10000))',
          '(assert (=> (< customerAge 18) (<= orderAmount 500)))',
          'Z3 check-sat: unsat',
        ],
        suggestedResolution: 'Review age and amount thresholds for RULE-106 or remove the rule to reduce evaluation overhead.',
      },
    },
  ],
};

export const MOCK_COUNTERFACTUAL_RESPONSE: CounterfactualResponse = {
  rulesetId: 'rs-ecommerce-discounts',
  version: '1.2.0',
  solver: 'Z3 Optimizer (MaxSMT / Pareto minimal distance metric)',
  isOptimalityProven: true,
  searchDurationMs: 68,
  generatedAt: '2026-10-18T20:15:30Z',
  originalInput: {
    customerTier: 'SILVER',
    orderAmount: 2200,
    creditScore: 680,
    customerAge: 29,
    region: 'US_EAST',
    isFirstOrder: false,
  },
  originalOutcome: {
    eligible: true,
    discountPercentage: 0,
    freeShipping: false,
  },
  targetOutcome: {
    field: 'discountPercentage',
    operator: '>=',
    targetValue: 10,
  },
  explanations: [
    {
      id: 'CF-EXPLAIN-01',
      rank: 1,
      totalCost: 1.0,
      isProvenOptimal: true,
      searchStatus: 'SUCCESS_OPTIMAL',
      solverLimitations: 'Proved minimal perturbation under weighted L1 distance function.',
      explanation: 'Smallest numeric change: Raising credit score from 680 to 720 and adding $301 to order amount triggers RULE-103 (Prime Credit Loyalty Boost), yielding 15% discount (exceeding your target of >= 10%).',
      responsibleRuleIds: ['RULE-103'],
      changedFields: [
        {
          field: 'creditScore',
          fieldLabel: 'Credit Score',
          originalValue: 680,
          proposedValue: 720,
          deltaDescription: '+40 points',
          cost: 0.6,
        },
        {
          field: 'orderAmount',
          fieldLabel: 'Order Amount',
          originalValue: 2200,
          proposedValue: 2501,
          deltaDescription: '+$301.00',
          cost: 0.4,
        },
      ],
      simulatedInput: {
        customerTier: 'SILVER',
        orderAmount: 2501,
        creditScore: 720,
        customerAge: 29,
        region: 'US_EAST',
        isFirstOrder: false,
      },
      simulatedOutcome: {
        eligible: true,
        discountPercentage: 15,
        freeShipping: true,
      },
    },
    {
      id: 'CF-EXPLAIN-02',
      rank: 2,
      totalCost: 1.8,
      isProvenOptimal: false, // Alternate heuristic candidate
      searchStatus: 'SUCCESS_HEURISTIC',
      solverLimitations: 'Alternate candidate found within delta radius.',
      explanation: 'Tier upgrade alternative: Elevating customer tier from SILVER to GOLD and increasing cart total by $301 triggers RULE-102 (Gold Member Threshold Incentive), yielding exactly 10% discount.',
      responsibleRuleIds: ['RULE-102'],
      changedFields: [
        {
          field: 'customerTier',
          fieldLabel: 'Customer Tier',
          originalValue: 'SILVER',
          proposedValue: 'GOLD',
          deltaDescription: 'Upgrade tier from SILVER to GOLD',
          cost: 1.2,
        },
        {
          field: 'orderAmount',
          fieldLabel: 'Order Amount',
          originalValue: 2200,
          proposedValue: 2501,
          deltaDescription: '+$301.00',
          cost: 0.6,
        },
      ],
      simulatedInput: {
        customerTier: 'GOLD',
        orderAmount: 2501,
        creditScore: 680,
        customerAge: 29,
        region: 'US_EAST',
        isFirstOrder: false,
      },
      simulatedOutcome: {
        eligible: true,
        discountPercentage: 10,
        freeShipping: false,
      },
    },
  ],
};

export const MOCK_BACKTEST_JOB: BacktestJob = {
  id: 'BT-RUN-9924',
  rulesetId: 'rs-ecommerce-discounts',
  baselineVersion: 'v1.1.0',
  candidateVersion: 'v1.2.0',
  datasetId: 'ds-q3-prod-historical',
  datasetName: 'Q3 2026 Production Order Replay (Sample: 10,000 Records)',
  status: 'COMPLETED',
  recordsProcessed: 10000,
  totalRecords: 10000,
  changedDecisions: 1420,
  unchangedDecisions: 8580,
  percentageChanged: 14.2,
  estimatedFinancialImpact: 42850, // +$42,850 in additional promotional discounts granted
  createdAt: '2026-10-18T17:30:00Z',
  completedAt: '2026-10-18T17:31:14Z',
  warnings: [
    '54 records contained edge-case credit score values (=720 boundary condition)',
    'Candidate version increases discount payout for US_EAST Gold segment by 18.4%',
  ],
  outcomeDistributions: {
    baseline: {
      zeroDiscount: 5800,
      tier5to10: 2400,
      tier10to20: 1600,
      tier20Plus: 200,
      ineligible: 300,
    },
    candidate: {
      zeroDiscount: 4380,
      tier5to10: 2200,
      tier10to20: 2820,
      tier20Plus: 600,
      ineligible: 280,
    },
  },
  tierBreakdown: [
    {
      tier: 'PLATINUM',
      totalRecords: 1200,
      changedCount: 380,
      avgDiscountBaseline: 15.2,
      avgDiscountCandidate: 19.4,
      netFinancialDelta: 18200,
    },
    {
      tier: 'GOLD',
      totalRecords: 2800,
      changedCount: 620,
      avgDiscountBaseline: 9.8,
      avgDiscountCandidate: 13.5,
      netFinancialDelta: 16400,
    },
    {
      tier: 'SILVER',
      totalRecords: 3500,
      changedCount: 310,
      avgDiscountBaseline: 2.1,
      avgDiscountCandidate: 4.6,
      netFinancialDelta: 6150,
    },
    {
      tier: 'BRONZE',
      totalRecords: 2500,
      changedCount: 110,
      avgDiscountBaseline: 0.8,
      avgDiscountCandidate: 1.2,
      netFinancialDelta: 2100,
    },
  ],
  regionBreakdown: [
    { region: 'US_EAST', totalRecords: 4100, changedCount: 610, netFinancialDelta: 19800 },
    { region: 'US_WEST', totalRecords: 3200, changedCount: 460, netFinancialDelta: 14200 },
    { region: 'EU_WEST', totalRecords: 1800, changedCount: 240, netFinancialDelta: 6450 },
    { region: 'APAC', totalRecords: 900, changedCount: 110, netFinancialDelta: 2400 },
  ],
  changedRecords: [
    {
      recordId: 'REC-ORD-88102',
      customerTier: 'GOLD',
      orderAmount: 3450,
      creditScore: 745,
      region: 'US_EAST',
      baselineOutcome: { eligible: true, discountPercentage: 10 },
      candidateOutcome: { eligible: true, discountPercentage: 15 },
      netDiscountDifference: 5,
      dollarImpact: 172.5,
      deltaReason: 'RULE-103 (Prime Credit Loyalty Boost) matched with higher priority over RULE-102',
      triggeringRules: {
        baselineRuleIds: ['RULE-102'],
        candidateRuleIds: ['RULE-103'],
      },
    },
    {
      recordId: 'REC-ORD-88145',
      customerTier: 'PLATINUM',
      orderAmount: 5800,
      creditScore: 710,
      region: 'US_WEST',
      baselineOutcome: { eligible: true, discountPercentage: 10 },
      candidateOutcome: { eligible: true, discountPercentage: 20 },
      netDiscountDifference: 10,
      dollarImpact: 580.0,
      deltaReason: 'RULE-101 VIP High Value threshold met ($5,800 > $5,000)',
      triggeringRules: {
        baselineRuleIds: ['RULE-102'],
        candidateRuleIds: ['RULE-101'],
      },
    },
    {
      recordId: 'REC-ORD-88209',
      customerTier: 'SILVER',
      orderAmount: 1800,
      creditScore: 730,
      region: 'US_EAST',
      baselineOutcome: { eligible: true, discountPercentage: 0 },
      candidateOutcome: { eligible: true, discountPercentage: 15 },
      netDiscountDifference: 15,
      dollarImpact: 270.0,
      deltaReason: 'Prime credit boost (RULE-103) newly matched on order over $1,500 with credit score >= 720',
      triggeringRules: {
        baselineRuleIds: [],
        candidateRuleIds: ['RULE-103'],
      },
    },
    {
      recordId: 'REC-ORD-88390',
      customerTier: 'BRONZE',
      orderAmount: 450,
      creditScore: 520,
      region: 'APAC',
      baselineOutcome: { eligible: true, discountPercentage: 5 },
      candidateOutcome: { eligible: false, discountPercentage: 0 },
      netDiscountDifference: -5,
      dollarImpact: -22.5,
      deltaReason: 'Subprime restriction (RULE-105) disqualified returning customer with credit score < 550',
      triggeringRules: {
        baselineRuleIds: ['RULE-104'],
        candidateRuleIds: ['RULE-105'],
      },
    },
    {
      recordId: 'REC-ORD-88412',
      customerTier: 'PLATINUM',
      orderAmount: 7200,
      creditScore: 810,
      region: 'EU_WEST',
      baselineOutcome: { eligible: true, discountPercentage: 10 },
      candidateOutcome: { eligible: true, discountPercentage: 20 },
      netDiscountDifference: 10,
      dollarImpact: 720.0,
      deltaReason: 'VIP High Value bonus (RULE-101) elevated discount from standard 10% to 20%',
      triggeringRules: {
        baselineRuleIds: ['RULE-102'],
        candidateRuleIds: ['RULE-101'],
      },
    },
  ],
};

export function simulateMockEvaluation(
  rulesetId: string,
  input: EvaluationInput
): EvaluationResult {
  const startTime = performance.now();
  const rules = INITIAL_RULES.filter((r) => r.enabled);
  const trace = [];
  const matchedRules: Rule[] = [];
  const unmatchedRules: { rule: Rule; failedPredicate: string }[] = [];
  const reasons: string[] = [];

  let finalEligible = true;
  let maxDiscount = 0;
  let appliedActions = { eligible: true, discountPercentage: 0 };

  for (const rule of rules) {
    let matched = false;
    let failedPredicate = '';

    if (rule.id === 'RULE-101') {
      matched = input.customerTier === 'PLATINUM' && input.orderAmount > 5000;
      if (!matched) {
        failedPredicate = input.customerTier !== 'PLATINUM' 
          ? `customerTier (${input.customerTier}) != PLATINUM` 
          : `orderAmount ($${input.orderAmount}) <= 5000`;
      }
    } else if (rule.id === 'RULE-102') {
      matched = input.customerTier === 'GOLD' && input.orderAmount > 2500;
      if (!matched) {
        failedPredicate = input.customerTier !== 'GOLD' 
          ? `customerTier (${input.customerTier}) != GOLD` 
          : `orderAmount ($${input.orderAmount}) <= 2500`;
      }
    } else if (rule.id === 'RULE-103') {
      matched = input.creditScore >= 720 && input.orderAmount > 1500;
      if (!matched) {
        failedPredicate = input.creditScore < 720 
          ? `creditScore (${input.creditScore}) < 720` 
          : `orderAmount ($${input.orderAmount}) <= 1500`;
      }
    } else if (rule.id === 'RULE-104') {
      matched = input.isFirstOrder === true && input.orderAmount >= 50;
      if (!matched) {
        failedPredicate = !input.isFirstOrder ? 'isFirstOrder == false' : `orderAmount ($${input.orderAmount}) < 50`;
      }
    } else if (rule.id === 'RULE-105') {
      matched = input.creditScore < 550 && input.isFirstOrder === false;
      if (!matched) {
        failedPredicate = input.creditScore >= 550 ? `creditScore (${input.creditScore}) >= 550` : 'isFirstOrder == true';
      }
    } else if (rule.id === 'RULE-106') {
      matched = input.customerAge < 18 && input.orderAmount > 10000 && input.customerTier === 'BRONZE';
      if (!matched) {
        failedPredicate = 'Unreachable domain state or condition failed';
      }
    }

    if (matched) {
      matchedRules.push(rule);
      if (rule.action.eligible !== undefined) {
        finalEligible = rule.action.eligible;
      }
      if (rule.action.discountPercentage !== undefined && rule.action.discountPercentage > maxDiscount) {
        maxDiscount = rule.action.discountPercentage;
        appliedActions = { ...appliedActions, ...rule.action };
      }
      reasons.push(rule.action.message || `${rule.name} matched.`);
      trace.push({
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        conditionEvaluated: true,
        conditionExpression: rule.condition,
        reason: rule.action.message || 'Condition satisfied.',
        actionApplied: rule.action,
      });
    } else {
      unmatchedRules.push({ rule, failedPredicate });
      trace.push({
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        conditionEvaluated: false,
        conditionExpression: rule.condition,
        reason: `Condition failed: ${failedPredicate}`,
      });
    }
  }

  const duration = Math.max(1.2, Math.round((performance.now() - startTime) * 10) / 10);

  return {
    rulesetId,
    rulesetVersion: '1.2.0',
    eligible: finalEligible,
    discountPercentage: finalEligible ? maxDiscount : 0,
    appliedActions: {
      ...appliedActions,
      discountPercentage: finalEligible ? maxDiscount : 0,
      eligible: finalEligible,
    },
    matchedRules,
    unmatchedRules,
    trace,
    reasons: reasons.length > 0 ? reasons : ['No promotional discount rules matched. Default pricing applied.'],
    evaluationDurationMs: duration,
    evaluatedAt: new Date().toISOString(),
  };
}
