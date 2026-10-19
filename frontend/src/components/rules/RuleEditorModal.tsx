import React, { useState, useEffect } from 'react';
import { Rule } from '../../types/ruleset';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { validateRuleExpressionAdvisory } from '../../lib/dsl-parser';
import { RuleSyntaxHighlighter } from './RuleSyntaxHighlighter';
import { AlertCircle, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Rule) => void;
  initialRule?: Rule | null;
  existingRuleIds?: string[];
}

const SAMPLE_RULES = [
  {
    label: 'VIP Platinum High-Value',
    condition: 'customerTier == PLATINUM AND orderAmount > 5000',
    discount: 20,
    eligible: true,
  },
  {
    label: 'Gold Member Mid-Tier',
    condition: 'customerTier == GOLD AND orderAmount > 2500',
    discount: 10,
    eligible: true,
  },
  {
    label: 'Prime Credit Score Booster',
    condition: 'creditScore >= 720 AND orderAmount > 1500',
    discount: 15,
    eligible: true,
  },
  {
    label: 'Subprime Risk Restriction',
    condition: 'creditScore < 550 AND isFirstOrder == false',
    discount: 0,
    eligible: false,
  },
];

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [condition, setCondition] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [eligible, setEligible] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (initialRule) {
      setId(initialRule.id);
      setName(initialRule.name);
      setDescription(initialRule.description || '');
      setPriority(initialRule.priority);
      setCondition(initialRule.condition);
      setDiscountPercentage(initialRule.action.discountPercentage ?? 10);
      setEligible(initialRule.action.eligible ?? true);
      setFreeShipping(initialRule.action.freeShipping ?? false);
      setMessage(initialRule.action.message || '');
      setEnabled(initialRule.enabled);
    } else {
      setId(`RULE-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setDescription('');
      setPriority(1);
      setCondition('customerTier == GOLD AND orderAmount > 2500');
      setDiscountPercentage(10);
      setEligible(true);
      setFreeShipping(false);
      setMessage('');
      setEnabled(true);
    }
  }, [initialRule, isOpen]);

  const advisoryValidation = validateRuleExpressionAdvisory(condition);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !condition.trim()) return;

    const savedRule: Rule = {
      id: id.trim() || `RULE-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      description: description.trim(),
      priority: Number(priority),
      condition: condition.trim(),
      action: {
        discountPercentage: Number(discountPercentage),
        eligible,
        freeShipping,
        message: message.trim() || undefined,
      },
      enabled,
      updatedAt: new Date().toISOString(),
    };

    onSave(savedRule);
    onClose();
  };

  const applySample = (sample: typeof SAMPLE_RULES[0]) => {
    setCondition(sample.condition);
    setDiscountPercentage(sample.discount);
    setEligible(sample.eligible);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRule ? 'Edit Business Rule' : 'Create New Business Rule'}
      description="Configure formal condition logic and authoritative execution actions."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sample rules picker */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Load Sample Condition:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SAMPLE_RULES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySample(s)}
                className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-[11px] cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 1: Rule ID & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
              Rule ID
            </label>
            <input
              type="text"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="RULE-101"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority Order (1 = Highest)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={enabled ? 'true' : 'false'}
              onChange={(e) => setEnabled(e.target.value === 'true')}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="true">Enabled (Active)</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>

        {/* Row 2: Name & Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. VIP Platinum High-Value Discount"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description / Business Intent
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Grants 20% discount for orders over $5,000"
          />
        </div>

        {/* Row 3: Condition Expression */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 font-mono">
              IF Condition Expression (DSL)
            </label>
            <span className="text-[11px] text-slate-400">
              Operators: <code className="font-mono text-slate-600 font-bold">AND, OR, ==, !=, &gt;, &lt;, &gt;=, &lt;=</code>
            </span>
          </div>
          <textarea
            required
            rows={2}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-white selection:bg-indigo-500"
            placeholder="customerTier == GOLD AND orderAmount > 2500"
          />

          {/* Syntax preview & advisory feedback */}
          <div className="mt-1 space-y-1">
            {advisoryValidation.errors.map((err, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}

            {advisoryValidation.warnings.map((warn, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{warn}</span>
              </div>
            ))}

            {advisoryValidation.valid && advisoryValidation.warnings.length === 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Client syntax check passed (advisory)</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Action Configuration */}
        <div className="border-t border-slate-200 pt-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            THEN Action Parameters
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Customer Eligibility</label>
              <select
                value={eligible ? 'true' : 'false'}
                onChange={(e) => setEligible(e.target.value === 'true')}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="true">Eligible (ALLOW)</option>
                <option value="false">Ineligible (DENY)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Grant Free Shipping</span>
              </label>
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-xs text-slate-600 mb-1">Action Reason / Public Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Platinum loyalty discount applied at checkout"
            />
          </div>
        </div>

        {/* Modal actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={!advisoryValidation.valid}>
            {initialRule ? 'Save Changes' : 'Add Rule to Set'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
