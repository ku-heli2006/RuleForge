import React from 'react';
import { VerificationFinding } from '../../types/verification';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { WitnessCard } from './WitnessCard';
import { CodeBlock } from '../common/CodeBlock';
import { RuleSyntaxHighlighter } from '../rules/RuleSyntaxHighlighter';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, HelpCircle } from 'lucide-react';

interface FindingDetailModalProps {
  finding: VerificationFinding | null;
  onClose: () => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
}) => {
  if (!finding) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="rose" icon={<AlertCircle className="w-3 h-3" />}>CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="amber" icon={<AlertTriangle className="w-3 h-3" />}>WARNING</Badge>;
      default:
        return <Badge variant="neutral" icon={<Info className="w-3 h-3" />}>INFO</Badge>;
    }
  };

  const getSolverBadge = (result: string) => {
    switch (result) {
      case 'SAT':
        return <Badge variant="amber" icon={<AlertTriangle className="w-3 h-3" />}>SAT (Witness Found)</Badge>;
      case 'UNSAT':
        return <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>UNSAT (Proven Infeasible)</Badge>;
      default:
        return <Badge variant="purple" icon={<HelpCircle className="w-3 h-3" />}>UNKNOWN (Inconclusive)</Badge>;
    }
  };

  return (
    <Modal
      isOpen={Boolean(finding)}
      onClose={onClose}
      title={`Finding Details: ${finding.id}`}
      description={`Formal verification diagnostic for rule(s): ${finding.ruleIds.join(', ')}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Status badges header */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <Badge variant="indigo">{finding.type}</Badge>
          {getSolverBadge(finding.solverResult)}
          {getSeverityBadge(finding.severity)}
          <span className="text-xs text-slate-400 font-mono ml-auto">
            {new Date(finding.timestamp).toLocaleString()}
          </span>
        </div>

        {/* Explanation text */}
        <div>
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Solver Explanation
          </h5>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/80">
            {finding.explanation}
          </p>
        </div>

        {/* Concrete Witness Input if present */}
        {finding.witnessInput && (
          <div>
            <WitnessCard witness={finding.witnessInput} />
          </div>
        )}

        {/* Conditions evaluated */}
        {finding.details?.conditions && finding.details.conditions.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Involved Rule Conditions
            </h5>
            <div className="space-y-2">
              {finding.details.conditions.map((c, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral" size="sm">{c.ruleId}</Badge>
                    <span className="text-slate-500 font-mono text-[11px]">Condition</span>
                  </div>
                  <RuleSyntaxHighlighter expression={c.condition} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions involved */}
        {finding.details?.actions && finding.details.actions.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Assigned Rule Actions
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {finding.details.actions.map((a, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-2.5 rounded text-xs">
                  <div className="font-mono text-indigo-700 font-semibold mb-1">
                    {a.ruleId} Action:
                  </div>
                  <pre className="font-mono text-[11px] text-slate-700">
                    {JSON.stringify(a.action, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SMT Solver Diagnostics / Proof Trace */}
        {finding.details?.solverDiagnostics && finding.details.solverDiagnostics.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Backend SMT Solver Diagnostics
            </h5>
            <CodeBlock
              language="smt2"
              code={finding.details.solverDiagnostics.join('\n')}
            />
          </div>
        )}

        {/* Suggested Resolution */}
        {finding.details?.suggestedResolution && (
          <div className="bg-indigo-50/70 border border-indigo-200/80 p-3 rounded text-xs text-indigo-950">
            <span className="font-semibold block mb-0.5">Formal Remediation Guidance:</span>
            <p className="leading-relaxed opacity-90">{finding.details.suggestedResolution}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
