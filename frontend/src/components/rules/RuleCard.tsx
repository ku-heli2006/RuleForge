import React from 'react';
import { Rule } from '../../types/ruleset';
import { Badge } from '../common/Badge';
import { RuleSyntaxHighlighter } from './RuleSyntaxHighlighter';
import { Edit2, Trash2, CheckCircle2, XCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RuleCardProps {
  rule: Rule;
  onEdit?: (rule: Rule) => void;
  onDelete?: (ruleId: string) => void;
  onToggleEnabled?: (ruleId: string, enabled: boolean) => void;
  isReadOnly?: boolean;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggleEnabled,
  isReadOnly = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-150',
        rule.enabled
          ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          : 'bg-slate-50/70 border-slate-200/60 opacity-60'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Badge variant="indigo" size="sm">
            {rule.id}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            <ArrowUpCircle className="w-3 h-3 text-slate-400" />
            Priority {rule.priority}
          </span>
          <h4 className="text-sm font-semibold text-slate-900 truncate">{rule.name}</h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isReadOnly && onToggleEnabled && (
            <button
              onClick={() => onToggleEnabled(rule.id, !rule.enabled)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer',
                rule.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              )}
            >
              {rule.enabled ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-slate-400" /> Disabled
                </>
              )}
            </button>
          )}

          {!isReadOnly && onEdit && (
            <button
              onClick={() => onEdit(rule)}
              className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit Rule"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {!isReadOnly && onDelete && (
            <button
              onClick={() => onDelete(rule.id)}
              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Rule"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {rule.description && (
        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{rule.description}</p>
      )}

      {/* Condition expression */}
      <div className="mb-3">
        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider block mb-1">
          IF Condition
        </span>
        <RuleSyntaxHighlighter expression={rule.condition} />
      </div>

      {/* Action configuration */}
      <div>
        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider block mb-1">
          THEN Action
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-50 border border-slate-100 p-2 rounded">
          {rule.action.eligible !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[11px] font-semibold',
                rule.action.eligible
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              )}
            >
              eligible = {rule.action.eligible ? 'TRUE' : 'FALSE'}
            </span>
          )}

          {rule.action.discountPercentage !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[11px]">
              discount = {rule.action.discountPercentage}%
            </span>
          )}

          {rule.action.freeShipping && (
            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px]">
              freeShipping = TRUE
            </span>
          )}

          {rule.action.message && (
            <span className="text-slate-600 font-sans text-xs truncate max-w-xs">
              "{rule.action.message}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
