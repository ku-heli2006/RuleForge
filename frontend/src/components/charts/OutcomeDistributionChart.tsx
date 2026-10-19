import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface OutcomeDistributionProps {
  baseline: {
    zeroDiscount: number;
    tier5to10: number;
    tier10to20: number;
    tier20Plus: number;
    ineligible: number;
  };
  candidate: {
    zeroDiscount: number;
    tier5to10: number;
    tier10to20: number;
    tier20Plus: number;
    ineligible: number;
  };
  baselineLabel?: string;
  candidateLabel?: string;
}

export const OutcomeDistributionChart: React.FC<OutcomeDistributionProps> = ({
  baseline,
  candidate,
  baselineLabel = 'Baseline Ruleset',
  candidateLabel = 'Candidate Ruleset',
}) => {
  const data = [
    {
      category: 'Ineligible (0%)',
      [baselineLabel]: baseline.ineligible,
      [candidateLabel]: candidate.ineligible,
    },
    {
      category: 'Standard (0%)',
      [baselineLabel]: baseline.zeroDiscount,
      [candidateLabel]: candidate.zeroDiscount,
    },
    {
      category: 'Low (5-10%)',
      [baselineLabel]: baseline.tier5to10,
      [candidateLabel]: candidate.tier5to10,
    },
    {
      category: 'Medium (10-20%)',
      [baselineLabel]: baseline.tier10to20,
      [candidateLabel]: candidate.tier10to20,
    },
    {
      category: 'High (>20%)',
      [baselineLabel]: baseline.tier20Plus,
      [candidateLabel]: candidate.tier20Plus,
    },
  ];

  return (
    <div className="w-full h-64 text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey={baselineLabel} fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey={candidateLabel} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
