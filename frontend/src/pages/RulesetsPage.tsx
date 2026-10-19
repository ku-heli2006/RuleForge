import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRulesets, useCreateRuleset } from '../hooks/useRulesets';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import {
  Layers,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Archive,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { formatRelativeDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export const RulesetsPage: React.FC = () => {
  const { data: rulesets, isLoading, error } = useRulesets();
  const createRulesetMutation = useCreateRuleset();
  const { info, success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const filteredRulesets = useMemo(() => {
    if (!rulesets) return [];
    return rulesets.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && r.status === 'PUBLISHED') ||
        (statusFilter === 'DRAFT' && r.isDraft);

      return matchesSearch && matchesStatus;
    });
  }, [rulesets, searchQuery, statusFilter]);

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

  const handleDuplicate = (name: string) => {
    createRulesetMutation.mutate({
      name: `${name} (Copy)`,
      description: `Duplicated from ${name}`,
    });
  };

  const handleArchive = (name: string) => {
    info('Ruleset Archived', `"${name}" has been marked as archived.`);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'SAT':
        return (
          <Badge variant="amber" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
            SAT (Witnesses)
          </Badge>
        );
      case 'UNSAT':
        return (
          <Badge variant="emerald" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
            UNSAT (Safe)
          </Badge>
        );
      case 'UNKNOWN':
        return (
          <Badge variant="purple" size="sm" icon={<HelpCircle className="w-3 h-3" />}>
            UNKNOWN
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            UNVERIFIED
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ruleset Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author, inspect, verify, and version business rules with formal Z3 solver backing.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Ruleset
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ruleset name, keyword, or ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Rulesets Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configured Rulesets ({filteredRulesets.length})</CardTitle>
            <CardDescription>
              Authoritative logic sets evaluated by the execution engine and formal solver
            </CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            Failed to load rulesets: {(error as Error).message}
          </div>
        ) : filteredRulesets.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No rulesets found"
            description={
              searchQuery
                ? `No ruleset matched "${searchQuery}". Try adjusting your filters.`
                : 'Create your first business ruleset to begin defining logic.'
            }
            actionLabel="Create Ruleset"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ruleset Name & Description</th>
                  <th className="py-3 px-4">Version & State</th>
                  <th className="py-3 px-4">Rules</th>
                  <th className="py-3 px-4">Z3 Verification</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRulesets.map((rs) => (
                  <tr key={rs.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/rulesets/${rs.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 text-sm"
                        >
                          {rs.name}
                        </Link>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                        {rs.description}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">{rs.id}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          v{rs.version}
                        </span>
                        <Badge
                          variant={rs.status === 'PUBLISHED' ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          {rs.status}
                        </Badge>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-slate-800 font-semibold bg-slate-100 px-2 py-1 rounded">
                        {rs.ruleCount} rules
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getVerificationBadge(rs.latestVerificationStatus)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                      {formatRelativeDate(rs.lastUpdated)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/rulesets/${rs.id}`}>
                          <Button variant="ghost" size="sm" title="Open Details">
                            Open
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(rs.name)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Duplicate Ruleset"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchive(rs.name)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Archive Ruleset"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
              Description / Domain Scope
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
