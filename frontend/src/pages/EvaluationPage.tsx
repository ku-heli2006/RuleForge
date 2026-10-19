import React, { useState } from 'react';
import { useRulesets } from '../hooks/useRulesets';
import { useEvaluateRuleset } from '../hooks/useEvaluation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { RuleSyntaxHighlighter } from '../components/rules/RuleSyntaxHighlighter';
import { EvaluationInput } from '../types/evaluation';
import { CustomerTier } from '../types/ruleset';
import {
  PlayCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  HelpCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const PRESETS: { label: string; description: string; input: EvaluationInput }[] = [
  {
    label: 'VIP Platinum High-Value',
    description: 'Platinum member with $5,200 cart and prime credit',
    input: {
      customerTier: 'PLATINUM',
      orderAmount: 5200,
      creditScore: 780,
      customerAge: 38,
      region: 'US_EAST',
      isFirstOrder: false,
    },
  },
  {
    label: 'Gold Member Mid-Tier',
    description: 'Gold customer spending $3,200 with credit score 740',
    input: {
      customerTier: 'GOLD',
      orderAmount: 3200,
      creditScore: 740,
      customerAge: 32,
      region: 'US_WEST',
      isFirstOrder: false,
    },
  },
  {
    label: 'New Bronze Customer',
    description: 'First order of $120 for new bronze shopper',
    input: {
      customerTier: 'BRONZE',
      orderAmount: 120,
      creditScore: 650,
      customerAge: 26,
      region: 'EU_WEST',
      isFirstOrder: true,
    },
  },
  {
    label: 'Subprime Risk Restriction',
    description: 'Low credit score (<550) returning account',
    input: {
      customerTier: 'SILVER',
      orderAmount: 1800,
      creditScore: 510,
      customerAge: 44,
      region: 'APAC',
      isFirstOrder: false,
    },
  },
];

export const EvaluationPage: React.FC = () => {
  const { data: rulesets } = useRulesets();
  const evaluateMutation = useEvaluateRuleset();

  const [selectedRulesetId, setSelectedRulesetId] = useState<string>('rs-ecommerce-discounts');
  const [selectedVersion, setSelectedVersion] = useState<string>('1.2.0');

  const [customerTier, setCustomerTier] = useState<CustomerTier>('GOLD');
  const [orderAmount, setOrderAmount] = useState<number>(3200);
  const [creditScore, setCreditScore] = useState<number>(740);
  const [customerAge, setCustomerAge] = useState<number>(34);
  const [region, setRegion] = useState<string>('US_EAST');
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setCustomerTier(preset.input.customerTier);
    setOrderAmount(preset.input.orderAmount);
    setCreditScore(preset.input.creditScore);
    setCustomerAge(preset.input.customerAge);
    setRegion(preset.input.region);
    setIsFirstOrder(preset.input.isFirstOrder);
  };

  const handleEvaluate = () => {
    evaluateMutation.mutate({
      id: selectedRulesetId,
      version: selectedVersion,
      input: {
        customerTier,
        orderAmount: Number(orderAmount),
        creditScore: Number(creditScore),
        customerAge: Number(customerAge),
        region,
        isFirstOrder,
      },
    });
  };

  const evaluationResult = evaluateMutation.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Evaluation Playground
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Interactive execution simulator. Submits test parameters to the authoritative engine to inspect matched rules and trace evaluation order.
        </p>
      </div>

      {/* Preset Pickers */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 rounded bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form & Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Simulator Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Evaluation Parameters</CardTitle>
                <CardDescription>Target ruleset & payload values</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ruleset selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Ruleset & Version
                </label>
                <select
                  value={selectedRulesetId}
                  onChange={(e) => setSelectedRulesetId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {rulesets?.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.name} (v{rs.version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Tier
                  </label>
                  <select
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value as CustomerTier)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    <option value="BRONZE">BRONZE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Order Amount ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Credit Score (300-850)
                  </label>
                  <input
                    type="number"
                    min={300}
                    max={850}
                    value={creditScore}
                    onChange={(e) => setCreditScore(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Age
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customerAge}
                    onChange={(e) => setCustomerAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    <option value="US_EAST">US_EAST</option>
                    <option value="US_WEST">US_WEST</option>
                    <option value="EU_WEST">EU_WEST</option>
                    <option value="APAC">APAC</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFirstOrder}
                      onChange={(e) => setIsFirstOrder(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>First-time Order</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full"
                  size="md"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                  isLoading={evaluateMutation.isPending}
                  onClick={handleEvaluate}
                >
                  Run Authoritative Evaluation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Outcome & Trace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {evaluationResult ? (
            <>
              {/* Outcome summary card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-4 bg-white">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Customer Eligibility
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {evaluationResult.eligible ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-base font-bold text-emerald-700">ELIGIBLE</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="text-base font-bold text-rose-700">INELIGIBLE</span>
                      </>
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Approved Discount
                  </span>
                  <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                    {evaluationResult.discountPercentage}%
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Engine Latency
                  </span>
                  <div className="flex items-center gap-1 text-slate-700 text-sm font-mono font-medium mt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evaluationResult.evaluationDurationMs} ms</span>
                  </div>
                </Card>
              </div>

              {/* Matched Rules Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Decision Rationale & Matched Rules</CardTitle>
                  <CardDescription>
                    {evaluationResult.matchedRules.length} rule(s) fired in priority order
                  </CardDescription>
                </CardHeader>
                <div className="divide-y divide-slate-100 text-xs">
                  {evaluationResult.matchedRules.map((rule) => (
                    <div key={rule.id} className="p-3.5 space-y-2 bg-emerald-50/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo" size="sm">
                            {rule.id}
                          </Badge>
                          <span className="font-semibold text-slate-900">{rule.name}</span>
                        </div>
                        <Badge variant="emerald" size="sm">
                          MATCHED (Priority {rule.priority})
                        </Badge>
                      </div>
                      <RuleSyntaxHighlighter expression={rule.condition} />
                      <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-slate-200">
                        Applied Action: discount = {rule.action.discountPercentage}% | {rule.action.message}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Structured Evaluation Trace Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Trace Timeline</CardTitle>
                  <CardDescription>
                    Step-by-step condition evaluation across the ruleset
                  </CardDescription>
                </CardHeader>
                <div className="divide-y divide-slate-100 text-xs">
                  {evaluationResult.trace.map((step, idx) => (
                    <div key={idx} className="p-3 flex items-start gap-3">
                      <div className="mt-0.5">
                        {step.conditionEvaluated ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800">
                            {step.ruleId} — {step.ruleName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Priority {step.priority}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-600 break-all">
                          {step.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg">
              <PlayCircle className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">Awaiting Simulation</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Configure your input parameters on the left or select a preset, then click "Run Authoritative Evaluation".
              </p>
              <Button size="sm" onClick={handleEvaluate}>
                Run Quick Simulation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
