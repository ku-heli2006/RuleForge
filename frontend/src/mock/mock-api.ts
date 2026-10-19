import { Ruleset, CreateRulesetInput, UpdateRulesetInput, Rule } from '../types/ruleset';
import { EvaluationResult, EvaluationInput } from '../types/evaluation';
import { VerificationResponse, VerificationRequest } from '../types/verification';
import { CounterfactualResponse, CounterfactualRequest } from '../types/counterfactual';
import { BacktestJob, BacktestRequest } from '../types/backtest';
import { HealthStatus, RuleValidationResponse } from '../types/api';
import {
  MOCK_RULESETS,
  MOCK_VERIFICATION_RESPONSE,
  MOCK_COUNTERFACTUAL_RESPONSE,
  MOCK_BACKTEST_JOB,
  simulateMockEvaluation,
} from './mock-data';

// In-memory state for demo mode interactivity
let rulesetsState: Ruleset[] = [...MOCK_RULESETS];
let backtestJobsState: Record<string, BacktestJob> = {
  [MOCK_BACKTEST_JOB.id]: { ...MOCK_BACKTEST_JOB },
};

export const mockApi = {
  async getHealth(): Promise<HealthStatus> {
    await new Promise((r) => setTimeout(r, 80));
    return {
      status: 'UP',
      version: '1.4.2-demo',
      solver: {
        name: 'Z3 SMT Solver (Demonstration Mock)',
        version: '4.12.2-synthetic',
        available: true,
      },
      uptimeSeconds: 14280,
      timestamp: new Date().toISOString(),
    };
  },

  async getRulesets(): Promise<Ruleset[]> {
    await new Promise((r) => setTimeout(r, 120));
    return [...rulesetsState];
  },

  async getRuleset(id: string): Promise<Ruleset> {
    await new Promise((r) => setTimeout(r, 100));
    const rs = rulesetsState.find((r) => r.id === id);
    if (!rs) {
      throw new Error(`Ruleset not found: ${id}`);
    }
    return { ...rs };
  },

  async createRuleset(input: CreateRulesetInput): Promise<Ruleset> {
    await new Promise((r) => setTimeout(r, 200));
    const newRuleset: Ruleset = {
      id: `rs-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: input.name,
      description: input.description,
      version: '1.0.0-draft',
      status: 'DRAFT',
      isDraft: true,
      ruleCount: input.initialRules?.length || 0,
      latestVerificationStatus: 'UNVERIFIED',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      rules: input.initialRules || [],
      versions: [
        {
          version: '1.0.0-draft',
          isDraft: true,
          author: 'current-user@ruleforge.io',
          commitMessage: 'Initial draft created',
          ruleCount: input.initialRules?.length || 0,
          verificationStatus: 'UNVERIFIED',
        },
      ],
    };
    rulesetsState = [newRuleset, ...rulesetsState];
    return newRuleset;
  },

  async updateRuleset(id: string, input: UpdateRulesetInput): Promise<Ruleset> {
    await new Promise((r) => setTimeout(r, 150));
    const index = rulesetsState.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Ruleset not found: ${id}`);
    }
    const current = rulesetsState[index];
    const updated: Ruleset = {
      ...current,
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      rules: input.rules ?? current.rules,
      ruleCount: input.rules ? input.rules.length : current.ruleCount,
      status: input.status ?? current.status,
      isDraft: input.status ? input.status === 'DRAFT' : current.isDraft,
      lastUpdated: new Date().toISOString(),
    };
    rulesetsState[index] = updated;
    return updated;
  },

  async validateRuleset(id: string, rules: Rule[]): Promise<RuleValidationResponse> {
    await new Promise((r) => setTimeout(r, 180));
    const errors = [];
    const warnings = [];

    for (const rule of rules) {
      if (!rule.name.trim()) {
        errors.push({
          ruleId: rule.id,
          field: 'name',
          message: `Rule ID ${rule.id}: Name cannot be empty.`,
          severity: 'ERROR' as const,
        });
      }
      if (!rule.condition.trim()) {
        errors.push({
          ruleId: rule.id,
          field: 'condition',
          message: `Rule ID ${rule.id}: Condition expression cannot be empty.`,
          severity: 'ERROR' as const,
        });
      }
      if (rule.priority < 1) {
        warnings.push({
          ruleId: rule.id,
          field: 'priority',
          message: `Rule ID ${rule.id}: Priority should be a positive integer.`,
          severity: 'WARNING' as const,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      parsedRulesCount: rules.length,
    };
  },

  async evaluateRuleset(
    id: string,
    input: EvaluationInput,
    _version?: string
  ): Promise<EvaluationResult> {
    await new Promise((r) => setTimeout(r, 220));
    return simulateMockEvaluation(id, input);
  },

  async verifyRuleset(
    id: string,
    _options?: VerificationRequest['options']
  ): Promise<VerificationResponse> {
    await new Promise((r) => setTimeout(r, 380));
    const ruleset = rulesetsState.find((r) => r.id === id);
    return {
      ...MOCK_VERIFICATION_RESPONSE,
      rulesetId: id,
      version: ruleset ? ruleset.version : '1.2.0',
      timestamp: new Date().toISOString(),
    };
  },

  async getCounterfactuals(
    request: CounterfactualRequest
  ): Promise<CounterfactualResponse> {
    await new Promise((r) => setTimeout(r, 450));
    return {
      ...MOCK_COUNTERFACTUAL_RESPONSE,
      rulesetId: request.rulesetId,
      version: request.version || '1.2.0',
      originalInput: request.originalInput,
      targetOutcome: request.targetOutcome,
      generatedAt: new Date().toISOString(),
    };
  },

  async runBacktest(request: BacktestRequest): Promise<BacktestJob> {
    await new Promise((r) => setTimeout(r, 300));
    const jobId = `BT-RUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob: BacktestJob = {
      ...MOCK_BACKTEST_JOB,
      id: jobId,
      rulesetId: request.rulesetId,
      baselineVersion: request.baselineVersion,
      candidateVersion: request.candidateVersion,
      datasetId: request.datasetId,
      datasetName: request.datasetId === 'ds-q3-prod-historical' 
        ? 'Q3 2026 Production Order Replay (10,000 Records)' 
        : 'Synthetic Edge-Case Stress Suite (5,000 Records)',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    backtestJobsState[jobId] = newJob;
    return newJob;
  },

  async getBacktest(id: string): Promise<BacktestJob> {
    await new Promise((r) => setTimeout(r, 120));
    const job = backtestJobsState[id] || MOCK_BACKTEST_JOB;
    return { ...job };
  },

  async exportBacktestCsv(id: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 150));
    const job = backtestJobsState[id] || MOCK_BACKTEST_JOB;
    const headers = [
      'RecordID',
      'CustomerTier',
      'OrderAmount',
      'CreditScore',
      'Region',
      'BaselineEligible',
      'BaselineDiscountPct',
      'CandidateEligible',
      'CandidateDiscountPct',
      'DiscountDeltaPct',
      'DollarImpact',
      'DeltaReason',
    ];
    const rows = job.changedRecords.map((r) => [
      r.recordId,
      r.customerTier,
      r.orderAmount,
      r.creditScore,
      r.region,
      r.baselineOutcome.eligible,
      r.baselineOutcome.discountPercentage,
      r.candidateOutcome.eligible,
      r.candidateOutcome.discountPercentage,
      r.netDiscountDifference,
      r.dollarImpact,
      `"${r.deltaReason.replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
