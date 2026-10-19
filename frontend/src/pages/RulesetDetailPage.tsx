import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRuleset, useUpdateRuleset, useValidateRuleset } from '../hooks/useRulesets';
import { useVerifyRuleset } from '../hooks/useVerification';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Tabs } from '../components/common/Tabs';
import { RuleCard } from '../components/rules/RuleCard';
import { RuleEditorModal } from '../components/rules/RuleEditorModal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { FindingDetailModal } from '../components/verification/FindingDetailModal';
import { Rule } from '../types/ruleset';
import { VerificationFinding } from '../types/verification';
import {
  Layers,
  ShieldCheck,
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck,
  Lock,
  GitCommit,
  Cpu,
} from 'lucide-react';
import { formatRelativeDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const RulesetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: ruleset, isLoading, error } = useRuleset(id);
  const updateRulesetMutation = useUpdateRuleset(id || '');
  const validateRulesetMutation = useValidateRuleset(id || '');
  const verifyRulesetMutation = useVerifyRuleset();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState('rules');
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<Rule | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<VerificationFinding | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error || !ruleset) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg">
        <p className="text-sm font-semibold text-rose-600">Failed to load ruleset</p>
        <p className="text-xs text-slate-500 mt-1">
          {error ? (error as Error).message : 'Ruleset not found.'}
        </p>
        <Link to="/rulesets" className="mt-4 inline-block">
          <Button size="sm" variant="outline">
            Back to Rulesets
          </Button>
        </Link>
      </div>
    );
  }

  const isPublished = ruleset.status === 'PUBLISHED';

  const handleSaveRule = (savedRule: Rule) => {
    const existingIndex = ruleset.rules.findIndex((r) => r.id === savedRule.id);
    let updatedRules: Rule[];

    if (existingIndex >= 0) {
      updatedRules = [...ruleset.rules];
      updatedRules[existingIndex] = savedRule;
    } else {
      updatedRules = [...ruleset.rules, savedRule];
    }

    // Sort by priority ascending
    updatedRules.sort((a, b) => a.priority - b.priority);

    updateRulesetMutation.mutate({ rules: updatedRules });
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = ruleset.rules.filter((r) => r.id !== ruleId);
    updateRulesetMutation.mutate({ rules: updated });
  };

  const handleToggleRuleEnabled = (ruleId: string, enabled: boolean) => {
    const updated = ruleset.rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r));
    updateRulesetMutation.mutate({ rules: updated });
  };

  const handlePublishToggle = () => {
    if (isPublished) {
      updateRulesetMutation.mutate({ status: 'DRAFT' });
    } else {
      updateRulesetMutation.mutate({ status: 'PUBLISHED' });
    }
  };

  const handleAuthoritativeValidate = () => {
    validateRulesetMutation.mutate(ruleset.rules);
  };

  const handleTriggerVerification = () => {
    verifyRulesetMutation.mutate({
      id: ruleset.id,
      options: {
        checkConflict: true,
        checkOverlap: true,
        checkUnreachable: true,
        checkShadowed: true,
      },
    });
  };

  const tabs = [
    { id: 'rules', label: 'Rules & Logic', badge: ruleset.rules.length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'verification', label: 'Formal Verification', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'versions', label: 'Version History', badge: ruleset.versions?.length || 1, icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Ruleset Detail Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ruleset.name}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                v{ruleset.version}
              </span>
              <Badge variant={isPublished ? 'emerald' : 'amber'} size="sm">
                {ruleset.status}
              </Badge>
              {isPublished && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <Lock className="w-3 h-3 text-slate-400" /> Immutable Version
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              {ruleset.description}
            </p>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
              <span>ID: {ruleset.id}</span>
              <span>•</span>
              <span>Updated: {formatRelativeDate(ruleset.lastUpdated)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileCheck className="w-3.5 h-3.5" />}
              isLoading={validateRulesetMutation.isPending}
              onClick={handleAuthoritativeValidate}
              title="Submit rules to backend compiler for authoritative schema & type check"
            >
              Validate Rules
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Cpu className="w-3.5 h-3.5 text-indigo-600" />}
              isLoading={verifyRulesetMutation.isPending}
              onClick={handleTriggerVerification}
            >
              Run Z3 Verification
            </Button>

            <Link to="/playground">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Simulate
              </Button>
            </Link>

            <Button
              variant={isPublished ? 'ghost' : 'secondary'}
              size="sm"
              onClick={handlePublishToggle}
            >
              {isPublished ? 'Convert to Draft' : 'Publish Version'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
              Ordered Execution Priority ({ruleset.rules.length} Rules)
            </span>
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelectedRuleForEdit(null);
                setIsEditorModalOpen(true);
              }}
            >
              Add Rule
            </Button>
          </div>

          {ruleset.rules.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No rules in this ruleset"
              description="Define business rules with formal preconditions and actions."
              actionLabel="Add First Rule"
              onAction={() => {
                setSelectedRuleForEdit(null);
                setIsEditorModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {ruleset.rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={(r) => {
                    setSelectedRuleForEdit(r);
                    setIsEditorModalOpen(true);
                  }}
                  onDelete={handleDeleteRule}
                  onToggleEnabled={handleToggleRuleEnabled}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Verification */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Formal Verification Status</CardTitle>
                <CardDescription>
                  Automated constraint satisfiability (SMT) via backend Z3 solver
                </CardDescription>
              </div>
              <Button
                size="sm"
                leftIcon={<Cpu className="w-3.5 h-3.5" />}
                isLoading={verifyRulesetMutation.isPending}
                onClick={handleTriggerVerification}
              >
                Run Solver Verification
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Solver Result
                  </span>
                  <Badge variant="amber" size="md" className="mt-1">
                    SAT (Witness Found)
                  </Badge>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Conflicts
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-600">1</span>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Overlaps
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-600">1</span>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Unreachable / Shadowed
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-700">1</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Solver: Z3 4.12.2 (SMT-LIB2 QF_LIA)</span>
                <Link to="/verification" className="text-indigo-600 hover:underline font-semibold">
                  Open Complete Verification Workspace &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Versions */}
      {activeTab === 'versions' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Release & Version History</CardTitle>
              <CardDescription>
                Immutable snapshots of approved business rulesets
              </CardDescription>
            </div>
          </CardHeader>
          <div className="divide-y divide-slate-100 text-xs">
            {ruleset.versions?.map((v, i) => (
              <div key={i} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-indigo-50 text-indigo-700 mt-0.5">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        v{v.version}
                      </span>
                      <Badge variant={v.isDraft ? 'amber' : 'emerald'} size="sm">
                        {v.isDraft ? 'DRAFT' : 'PUBLISHED'}
                      </Badge>
                      <Badge variant={v.verificationStatus === 'UNSAT' ? 'emerald' : 'amber'} size="sm">
                        {v.verificationStatus}
                      </Badge>
                    </div>
                    <p className="text-slate-700 font-medium mt-1">{v.commitMessage}</p>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>Author: {v.author}</span>
                      {v.publishedAt && (
                        <span> • Published: {new Date(v.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-slate-500">{v.ruleCount} rules</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rule Editor Modal */}
      <RuleEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onSave={handleSaveRule}
        initialRule={selectedRuleForEdit}
      />

      {/* Finding Detail Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </div>
  );
};
