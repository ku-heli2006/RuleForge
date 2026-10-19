import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRulesets, useCreateRuleset } from '../hooks/useRulesets';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { OutcomeDistributionChart } from '../components/charts/OutcomeDistributionChart';
import { MOCK_BACKTEST_JOB, MOCK_VERIFICATION_RESPONSE } from '../mock/mock-data';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  History,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/utils';
import { useDemoMode } from '../context/DemoModeContext';

export const DashboardPage: React.FC = () => {
  const { data: rulesets, isLoading } = useRulesets();
  const createRulesetMutation = useCreateRuleset();
  const { isDemo } = useDemoMode();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const totalRulesets = rulesets?.length ?? 0;
  const publishedCount = rulesets?.filter((r) => r.status === 'PUBLISHED').length ?? 0;
  const draftCount = rulesets?.filter((r) => r.isDraft).length ?? 0;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createRulesetMutation.mutateAsync({
      name: newTitle.trim(),
      description: newDescription.trim(),
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h1>
            {isDemo && (
              <Badge variant="amber" size="sm">
                Demonstration Mode
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status of verifiable rulesets, formal Z3 verification findings, and historical impact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Ruleset
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Total Rulesets
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {isLoading ? '...' : totalRulesets}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-medium">{publishedCount} Published</span>
            <span>•</span>
            <span className="text-amber-700 font-medium">{draftCount} Drafts</span>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Verification State
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="md">
              SAT (Witnesses Found)
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Z3 Solver v4.12.2 evaluated</span>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Recent Findings
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {MOCK_VERIFICATION_RESPONSE.summary.totalFindings}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-rose-600 font-semibold">1 Conflict</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">1 Overlap</span>
            <span>•</span>
            <span className="text-slate-600">1 Unreachable</span>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">
              Backtest Impact
            </span>
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {formatPercent(MOCK_BACKTEST_JOB.percentageChanged)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-indigo-600" />
            <span>{formatCurrency(MOCK_BACKTEST_JOB.estimatedFinancialImpact)} net discount delta</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Verification Findings & Backtest Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Backtest outcome comparison chart */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Historical Replay Outcome Distribution</CardTitle>
                <CardDescription>
                  Comparison between baseline (v1.1.0) and candidate ruleset (v1.2.0) across 10,000 orders
                </CardDescription>
              </div>
              <Link to="/backtesting">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                  Explore Backtest
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <OutcomeDistributionChart
                baseline={MOCK_BACKTEST_JOB.outcomeDistributions.baseline}
                candidate={MOCK_BACKTEST_JOB.outcomeDistributions.candidate}
                baselineLabel="v1.1.0 (Baseline)"
                candidateLabel="v1.2.0 (Candidate)"
              />
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <span>Dataset: Q3 2026 Production Order Replay (10,000 Records)</span>
                <span className="font-mono text-indigo-700 font-medium">
                  {MOCK_BACKTEST_JOB.changedDecisions.toLocaleString()} decisions changed
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Ruleset Catalog */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Configured Rulesets</CardTitle>
                <CardDescription>Active business rule repositories</CardDescription>
              </div>
              <Link to="/rulesets">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                  View All ({totalRulesets})
                </Button>
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {rulesets?.slice(0, 3).map((rs) => (
                <div
                  key={rs.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/rulesets/${rs.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 text-sm truncate"
                      >
                        {rs.name}
                      </Link>
                      <Badge variant={rs.status === 'PUBLISHED' ? 'emerald' : 'amber'} size="sm">
                        {rs.status}
                      </Badge>
                      <span className="font-mono text-slate-400 text-xs">v{rs.version}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{rs.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {rs.ruleCount} rules
                    </span>
                    <Link to={`/rulesets/${rs.id}`}>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Recent Verification Findings & Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Findings Widget */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Latest Verification Findings</CardTitle>
                <CardDescription>Z3 SMT solver diagnostics for e-commerce rules</CardDescription>
              </div>
              <Link to="/verification">
                <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                  Workspace
                </Button>
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100 text-xs">
              {MOCK_VERIFICATION_RESPONSE.findings.map((f) => (
                <div key={f.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={f.type === 'CONFLICT' ? 'rose' : f.type === 'OVERLAP' ? 'amber' : 'neutral'}
                        size="sm"
                      >
                        {f.type}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-500">
                        {f.ruleIds.join(', ')}
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {f.solverResult}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{f.explanation}</p>

                  {f.witnessInput && (
                    <div className="font-mono text-[11px] bg-amber-50/70 border border-amber-200/60 p-2 rounded text-slate-800">
                      <span className="text-amber-900 font-semibold block text-[10px] uppercase font-sans mb-1">
                        Witness Assignment:
                      </span>
                      {Object.entries(f.witnessInput)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(' | ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Activity / Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Formal verification runs & backtest audits</CardDescription>
            </CardHeader>
            <div className="p-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-900 font-medium">Historical Backtest completed</p>
                  <p className="text-[11px] text-slate-500">10,000 records processed with 14.2% delta</p>
                  <span className="text-[10px] text-slate-400 font-mono">18 minutes ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-900 font-medium">Z3 Solver Verification Run</p>
                  <p className="text-[11px] text-slate-500">Found 1 conflict and 1 overlap in v1.2.0</p>
                  <span className="text-[10px] text-slate-400 font-mono">1 hour ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-900 font-medium">Published Ruleset v1.2.0</p>
                  <p className="text-[11px] text-slate-500">By lead-architect@ruleforge.io</p>
                  <span className="text-[10px] text-slate-400 font-mono">3 days ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Ruleset Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Ruleset"
        description="Initialize an isolated business logic repository for verification and evaluation."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ruleset Name
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Dynamic Pricing & Markdown Policy"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Business Domain
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the decision criteria, constraints, and operational domain..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createRulesetMutation.isPending}
            >
              Create Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
