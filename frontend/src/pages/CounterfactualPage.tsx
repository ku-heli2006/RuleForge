import React, { useState } from 'react';
import { useRulesets } from '../hooks/useRulesets';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EvaluationInput } from '../types/evaluation';
import { CustomerTier } from '../types/ruleset';
import { CounterfactualResponse, TargetOutcomeCondition } from '../types/counterfactual';
import { getCounterfactuals } from '../api/counterfactuals';
import { MOCK_COUNTERFACTUAL_RESPONSE } from '../mock/mock-data';
import {
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const CounterfactualPage: React.FC = () => {
  const { data: rulesets } = useRulesets();
  const { error, success } = useToast();

  const [selectedRulesetId, setSelectedRulesetId] = useState<string>('rs-ecommerce-discounts');
  const [selectedVersion, setSelectedVersion] = useState<string>('1.2.0');

  // Input state
  const [customerTier, setCustomerTier] = useState<CustomerTier>('SILVER');
  const [orderAmount, setOrderAmount] = useState<number>(2200);
  const [creditScore, setCreditScore] = useState<number>(680);
  const [customerAge, setCustomerAge] = useState<number>(29);
  const [region, setRegion] = useState<string>('US_EAST');
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);

  // Target outcome configuration
  const [targetField, setTargetField] = useState<'discountPercentage' | 'eligible'>('discountPercentage');
  const [targetOperator, setTargetOperator] = useState<'>=' | '==' | '>'>('>=');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [maxCost, setMaxCost] = useState<number>(5.0);

  // State for results
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CounterfactualResponse | null>(MOCK_COUNTERFACTUAL_RESPONSE);
  const [selectedExplanationIndex, setSelectedExplanationIndex] = useState(0);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await getCounterfactuals({
        rulesetId: selectedRulesetId,
        version: selectedVersion,
        originalInput: {
          customerTier,
          orderAmount: Number(orderAmount),
          creditScore: Number(creditScore),
          customerAge: Number(customerAge),
          region,
          isFirstOrder,
        },
        targetOutcome: {
          field: targetField,
          operator: targetOperator,
          targetValue: targetField === 'discountPercentage' ? Number(targetValue) : true,
        },
        maxSearchCost: Number(maxCost),
      });

      setResult(response);
      setSelectedExplanationIndex(0);
      success('Counterfactual Analysis Computed', `Found ${response.explanations.length} minimal-cost path(s).`);
    } catch (err: unknown) {
      error('Counterfactual Search Failed', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const activeExplanation = result?.explanations[selectedExplanationIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Counterfactual Explorer
          </h1>
          <Badge variant="indigo" size="sm">
            What-If Solver
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Computes the minimum necessary changes to an input payload that would alter the business decision to reach a desired target outcome.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Payload & Target Goal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>1. Baseline Input Payload</CardTitle>
                <CardDescription>Initial facts for decision evaluation</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Customer Tier</label>
                  <select
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value as CustomerTier)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="BRONZE">BRONZE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Order Amount ($)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Credit Score</label>
                  <input
                    type="number"
                    value={creditScore}
                    onChange={(e) => setCreditScore(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Customer Age</label>
                  <input
                    type="number"
                    value={customerAge}
                    onChange={(e) => setCustomerAge(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Outcome Selector */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>2. Desired Target Outcome</CardTitle>
                <CardDescription>Outcome you want the rules engine to produce</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Target Field</label>
                  <select
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="discountPercentage">discountPercentage</option>
                    <option value="eligible">eligible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Condition</label>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded border border-slate-200">
                      {targetOperator}
                    </span>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      placeholder="e.g. 10"
                    />
                    <span className="text-slate-500 text-xs">%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Max Perturbation Search Radius</span>
                  <span className="font-mono text-indigo-600 font-semibold">{maxCost}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10.0}
                  step={0.5}
                  value={maxCost}
                  onChange={(e) => setMaxCost(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <Button
                className="w-full"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4" />}
                isLoading={isLoading}
                onClick={handleGenerate}
              >
                Find Minimum-Cost Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Counterfactual Explanations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result && activeExplanation ? (
            <>
              {/* Baseline vs Target banner */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                    Current Decision
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    Eligible: {result.originalOutcome.eligible ? 'YES' : 'NO'} | Discount:{' '}
                    {result.originalOutcome.discountPercentage}%
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                  <span className="text-[10px] uppercase font-mono text-indigo-600 block font-semibold">
                    Desired Target
                  </span>
                  <div className="text-sm font-bold text-indigo-950 mt-1 font-mono">
                    {result.targetOutcome.field} {result.targetOutcome.operator} {result.targetOutcome.targetValue}%
                  </div>
                </div>
              </div>

              {/* Multi-candidate tabs if more than one explanation */}
              {result.explanations.length > 1 && (
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    Explanations ({result.explanations.length}):
                  </span>
                  {result.explanations.map((exp, idx) => (
                    <button
                      key={exp.id}
                      onClick={() => setSelectedExplanationIndex(idx)}
                      className={cn(
                        'px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer',
                        selectedExplanationIndex === idx
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )}
                    >
                      Candidate #{exp.rank} (Cost: {exp.totalCost})
                    </button>
                  ))}
                </div>
              )}

              {/* Active Explanation Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle>Counterfactual Solution #{activeExplanation.rank}</CardTitle>
                      <CardDescription>
                        Smallest required modification to flip engine decision
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Optimality proof indicator */}
                      {activeExplanation.isProvenOptimal ? (
                        <Badge variant="emerald" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                          PROVEN OPTIMAL (Z3 MINIMAL)
                        </Badge>
                      ) : (
                        <Badge variant="amber" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                          BEST-FOUND CANDIDATE (HEURISTIC)
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Natural language explanation */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                    {activeExplanation.explanation}
                  </p>

                  {/* Changes Table: Before vs After */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                      Proposed Field Changes (Delta)
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="py-2 px-3">Field</th>
                            <th className="py-2 px-3">Original Value</th>
                            <th className="py-2 px-3">Proposed Value</th>
                            <th className="py-2 px-3">Required Delta</th>
                            <th className="py-2 px-3 text-right">Cost Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {activeExplanation.changedFields.map((fieldChange, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {fieldChange.fieldLabel}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {String(fieldChange.originalValue)}
                              </td>
                              <td className="py-2.5 px-3 text-indigo-600 font-bold">
                                {String(fieldChange.proposedValue)}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-700 font-medium">
                                {fieldChange.deltaDescription}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-700">
                                {fieldChange.cost}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Responsible Rule Trigger */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Responsible Rule:</span>
                      {activeExplanation.responsibleRuleIds.map((rid) => (
                        <Badge key={rid} variant="indigo" size="sm">
                          {rid}
                        </Badge>
                      ))}
                    </div>
                    <div className="font-mono text-slate-500">
                      Total Distance Metric: <strong>{activeExplanation.totalCost}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg">
              <Compass className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">
                Ready for Counterfactual Analysis
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Define the baseline input parameters and desired target outcome, then click "Find Minimum-Cost Changes".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
