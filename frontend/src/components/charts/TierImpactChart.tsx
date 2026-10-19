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
import { TierImpact } from '../../types/backtest';

interface TierImpactChartProps {
  tierData: TierImpact[];
}

export const TierImpactChart: React.FC<TierImpactChartProps> = ({ tierData }) => {
  const chartData = tierData.map((t) => ({
    tier: t.tier,
    'Avg Discount Baseline (%)': t.avgDiscountBaseline,
    'Avg Discount Candidate (%)': t.avgDiscountCandidate,
    'Changed Customers': t.changedCount,
  }));

  return (
    <div className="w-full h-64 text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="tier" tick={{ fill: '#64748b', fontSize: 11 }} />
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
          <Bar dataKey="Avg Discount Baseline (%)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Avg Discount Candidate (%)" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
