import React, { useState } from 'react';
import { useRulesets } from '../hooks/useRulesets';
import { useVerifyRuleset } from '../hooks/useVerification';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { WitnessCard } from '../components/verification/WitnessCard';
import { FindingDetailModal } from '../components/verification/FindingDetailModal';
import { MOCK_VERIFICATION_RESPONSE } from '../mock/mock-data';
import { VerificationFinding } from '../types/verification';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDemoMode } from '../context/DemoModeContext';

export const VerificationPage: React.FC = () => {
  const { data: rulesets } = useRulesets();
  const verifyMutation = useVerifyRuleset();
  const { isDemo } = useDemoMode();

  const [selectedRulesetId, setSelectedRulesetId] = useState<string>('rs-ecommerce-discounts');
  const [checkConflict, setCheckConflict] = useState(true);
  const [checkOverlap, setCheckOverlap] = useState(true);
  const [checkUnreachable, setCheckUnreachable] = useState(true);
  const [checkShadowed, setCheckShadowed] = useState(true);

  const [selectedFinding, setSelectedFinding] = useState<VerificationFinding | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const verificationData = verifyMutation.data || MOCK_VERIFICATION_RESPONSE;

  const handleRunVerification = () => {
    verifyMutation.mutate({
      id: selectedRulesetId,
      options: {
        checkConflict,
        checkOverlap,
        checkUnreachable,
        checkShadowed,
      },
    });
  };

  const findings = verificationData.findings.filter((f) => {
    if (typeFilter === 'ALL') return true;
    return f.type === typeFilter;
  });

  const getSolverBadge = (status: string) => {
    switch (status) {
      case 'SAT':
        return (
          <Badge variant="amber" size="md" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            SAT (Satisfiable Witness Found)
          </Badge>
        );
      case 'UNSAT':
        return (
          <Badge variant="emerald" size="md" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            UNSAT (Proven Infeasible / Safe)
          </Badge>
        );
      case 'UNKNOWN':
        return (
          <Badge variant="purple" size="md" icon={<HelpCircle className="w-3.5 h-3.5" />}>
            UNKNOWN (Inconclusive)
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Formal Verification Workspace
            </h1>
            <Badge variant="indigo" size="sm">
              Z3 SMT Backend
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated theorem proving for business logic: detects rule overlap, contradictory actions, dead branches, and shadowed rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            leftIcon={<Cpu className="w-3.5 h-3.5" />}
            isLoading={verifyMutation.isPending}
            onClick={handleRunVerification}
          >
            Run Formal Verification
          </Button>
        </div>
      </div>

      {/* Control Strip & Solver Configuration */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Target Ruleset:
            </span>
            <select
              value={selectedRulesetId}
              onChange={(e) => setSelectedRulesetId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {rulesets?.map((rs) => (
                <option key={rs.id} value={rs.id}>
                  {rs.name} (v{rs.version})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
              Verification Goals:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkConflict}
                onChange={(e) => setCheckConflict(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Conflicting Outcomes</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkOverlap}
                onChange={(e) => setCheckOverlap(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Rule Overlap</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkUnreachable}
                onChange={(e) => setCheckUnreachable(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Unreachable Rules</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkShadowed}
                onChange={(e) => setCheckShadowed(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Shadowed Rules</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Verification Solver Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Overall Solver Status
          </span>
          <div className="mt-1.5">{getSolverBadge(verificationData.solverStatus)}</div>
          <span className="text-[10px] text-slate-400 font-mono block mt-2">
            Engine: {verificationData.solver}
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Conflicting Outcomes
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {verificationData.summary.conflictCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Mutually exclusive actions
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Condition Overlaps
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {verificationData.summary.overlapCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Concurrent rule triggers
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Unreachable Rules
          </span>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
            {verificationData.summary.unreachableCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Cannot satisfy conditions
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Solver Latency
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {verificationData.verificationDurationMs} ms
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono text-[10px]">
            Run ID: {verificationData.runId}
          </span>
        </Card>
      </div>

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <CardTitle>Formal Verification Findings ({findings.length})</CardTitle>
              <CardDescription>
                Concrete counterexamples, overlap witnesses, and reachability proofs
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {(['ALL', 'CONFLICT', 'OVERLAP', 'UNREACHABLE', 'SHADOWED'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer',
                    typeFilter === t
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Finding Type</th>
                <th className="py-3 px-4">Involved Rules</th>
                <th className="py-3 px-4">Solver Result</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Explanation & Concrete Witness</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {findings.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={
                        f.type === 'CONFLICT'
                          ? 'rose'
                          : f.type === 'OVERLAP'
                          ? 'amber'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {f.type}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    {f.ruleIds.map((id) => (
                      <span key={id} className="bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        {id}
                      </span>
                    ))}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-800 text-[11px]">
                      {f.solverResult}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={
                        f.severity === 'CRITICAL'
                          ? 'rose'
                          : f.severity === 'WARNING'
                          ? 'amber'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {f.severity}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 max-w-md">
                    <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                      {f.explanation}
                    </p>
                    {f.witnessInput && (
                      <div className="mt-1.5 font-mono text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded inline-block">
                        <strong>Witness:</strong>{' '}
                        {Object.entries(f.witnessInput)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ExternalLink className="w-3 h-3" />}
                      onClick={() => setSelectedFinding(f)}
                    >
                      Inspect Finding
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Finding Detail Inspection Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </div>
  );
};
