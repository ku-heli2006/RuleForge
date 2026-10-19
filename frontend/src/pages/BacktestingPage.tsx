import React, { useState } from 'react';
import { useRulesets } from '../hooks/useRulesets';
import { useRunBacktest, useBacktestJob, useExportBacktestCsv } from '../hooks/useBacktests';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { OutcomeDistributionChart } from '../components/charts/OutcomeDistributionChart';
import { TierImpactChart } from '../components/charts/TierImpactChart';
import { MOCK_BACKTEST_JOB } from '../mock/mock-data';
import {
  History,
  Download,
  Play,
  TrendingUp,
  AlertTriangle,
  Layers,
  Database,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatRelativeDate } from '../lib/utils';
import { useDemoMode } from '../context/DemoModeContext';

export const BacktestingPage: React.FC = () => {
  const { data: rulesets } = useRulesets();
  const runBacktestMutation = useRunBacktest();
  const exportCsvMutation = useExportBacktestCsv();
  const { isDemo } = useDemoMode();

  const [selectedRulesetId, setSelectedRulesetId] = useState<string>('rs-ecommerce-discounts');
  const [baselineVersion, setBaselineVersion] = useState<string>('v1.1.0');
  const [candidateVersion, setCandidateVersion] = useState<string>('v1.2.0');
  const [datasetId, setDatasetId] = useState<string>('ds-q3-prod-historical');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Currently active backtest job ID (defaults to mock ID)
  const [activeJobId, setActiveJobId] = useState<string | null>(MOCK_BACKTEST_JOB.id);
  const { data: jobData, isLoading: isJobLoading } = useBacktestJob(activeJobId);

  const activeJob = jobData || MOCK_BACKTEST_JOB;

  const handleLaunchBacktest = async () => {
    const job = await runBacktestMutation.mutateAsync({
      rulesetId: selectedRulesetId,
      baselineVersion,
      candidateVersion,
      datasetId,
      segmentFilters: regionFilter !== 'ALL' ? { region: regionFilter } : undefined,
    });
    setActiveJobId(job.id);
  };

  const handleExportCsv = () => {
    if (activeJob) {
      exportCsvMutation.mutate(activeJob.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Historical Backtesting
            </h1>
            <Badge variant="indigo" size="sm">
              Impact Simulation
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Replay historical traffic against baseline and candidate ruleset versions to assess decision divergences and estimate revenue impacts prior to production deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            isLoading={exportCsvMutation.isPending}
            onClick={handleExportCsv}
            disabled={!activeJob}
          >
            Export Audit CSV
          </Button>

          <Button
            size="sm"
            leftIcon={<Play className="w-3.5 h-3.5" />}
            isLoading={runBacktestMutation.isPending}
            onClick={handleLaunchBacktest}
          >
            Run Backtest Replay
          </Button>
        </div>
      </div>

      {/* Control Configuration Panel */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Ruleset</label>
            <select
              value={selectedRulesetId}
              onChange={(e) => setSelectedRulesetId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {rulesets?.map((rs) => (
                <option key={rs.id} value={rs.id}>
                  {rs.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Baseline Version (Current)</label>
            <select
              value={baselineVersion}
              onChange={(e) => setBaselineVersion(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="v1.0.0">v1.0.0 (Legacy)</option>
              <option value="v1.1.0">v1.1.0 (Production)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Candidate Version (Proposed)</label>
            <select
              value={candidateVersion}
              onChange={(e) => setCandidateVersion(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="v1.2.0">v1.2.0 (Candidate Draft)</option>
              <option value="v2.0.0-rc1">v2.0.0-rc1 (Next Major)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Historical Dataset</label>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ds-q3-prod-historical">Q3 2026 Production Replay (10,000 Records)</option>
              <option value="ds-black-friday-synthetic">Stress Test Suite (5,000 Records)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Segment Filter (Region)</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Regions</option>
              <option value="US_EAST">US_EAST</option>
              <option value="US_WEST">US_WEST</option>
              <option value="EU_WEST">EU_WEST</option>
              <option value="APAC">APAC</option>
            </select>
          </div>
        </div>
      </Card>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Records Processed
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {activeJob.recordsProcessed.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dataset: {activeJob.datasetName}
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Decision Divergence
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {formatPercent(activeJob.percentageChanged)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeJob.changedDecisions.toLocaleString()} decisions altered
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Unchanged Decisions
          </span>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
            {activeJob.unchangedDecisions.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Consistent behavior preserved
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Est. Financial Impact
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            +{formatCurrency(activeJob.estimatedFinancialImpact)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Additional discount payout
          </span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Job Status
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {activeJob.status}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            {activeJob.id}
          </span>
        </Card>
      </div>

      {/* Warnings & Boundary alerts */}
      {activeJob.warnings && activeJob.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Backtesting Boundary Observations & Warnings:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
            {activeJob.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts Grid: Outcome Distribution & Tier Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Decision Outcome Distributions</CardTitle>
            <CardDescription>
              Comparing baseline ({activeJob.baselineVersion}) vs candidate ({activeJob.candidateVersion})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OutcomeDistributionChart
              baseline={activeJob.outcomeDistributions.baseline}
              candidate={activeJob.outcomeDistributions.candidate}
              baselineLabel={`${activeJob.baselineVersion} (Baseline)`}
              candidateLabel={`${activeJob.candidateVersion} (Candidate)`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact by Customer Tier</CardTitle>
            <CardDescription>
              Average discount percentages and affected accounts across tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TierImpactChart tierData={activeJob.tierBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Changed Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Changed Decision Records ({activeJob.changedRecords.length} Sample)</CardTitle>
              <CardDescription>
                Detailed comparison showing baseline vs candidate outcomes for altered transactions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Customer Attributes</th>
                <th className="py-3 px-4">Baseline Outcome</th>
                <th className="py-3 px-4">Candidate Outcome</th>
                <th className="py-3 px-4">Net Delta</th>
                <th className="py-3 px-4">Delta Reason / Rule Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {activeJob.changedRecords.map((rec) => (
                <tr key={rec.recordId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 text-[11px]">
                    {rec.recordId}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 font-semibold">{rec.customerTier}</div>
                    <div className="text-slate-500 text-[11px]">
                      {formatCurrency(rec.orderAmount)} | Score: {rec.creditScore} | {rec.region}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {rec.baselineOutcome.discountPercentage}% Discount
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      {rec.candidateOutcome.discountPercentage}% Discount
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-bold ${
                        rec.netDiscountDifference > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {rec.netDiscountDifference > 0 ? `+${rec.netDiscountDifference}%` : `${rec.netDiscountDifference}%`}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      ({rec.dollarImpact > 0 ? `+$${rec.dollarImpact.toFixed(2)}` : `-$${Math.abs(rec.dollarImpact).toFixed(2)}`})
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-xs text-slate-600 max-w-xs">
                    {rec.deltaReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
