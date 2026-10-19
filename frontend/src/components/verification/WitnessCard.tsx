import React from 'react';
import { FindingWitness } from '../../types/verification';
import { Sparkles } from 'lucide-react';

interface WitnessCardProps {
  witness: FindingWitness;
  title?: string;
  className?: string;
}

export const WitnessCard: React.FC<WitnessCardProps> = ({
  witness,
  title = 'Satisfying Assignment (Witness Input)',
  className = '',
}) => {
  const entries = Object.entries(witness);

  if (entries.length === 0) return null;

  return (
    <div
      className={`rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs font-mono text-slate-800 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 font-sans font-semibold text-amber-900 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>{title}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-white/90 border border-amber-200/80 px-2 py-1 rounded">
            <span className="text-[10px] text-slate-500 uppercase block tracking-wider font-mono">
              {key}
            </span>
            <span className="text-xs font-bold text-slate-900">
              {typeof value === 'boolean'
                ? value
                  ? 'TRUE'
                  : 'FALSE'
                : typeof value === 'number'
                ? value.toLocaleString()
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
