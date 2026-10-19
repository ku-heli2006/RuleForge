import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RuleCard } from '../components/rules/RuleCard';
import { Badge } from '../components/common/Badge';
import { Rule } from '../types/ruleset';

describe('RuleCard & Badge Components', () => {
  const sampleRule: Rule = {
    id: 'RULE-202',
    name: 'Gold Member Threshold Incentive',
    description: 'Grant 10% discount for orders over $2500',
    priority: 2,
    condition: 'customerTier == GOLD AND orderAmount > 2500',
    action: {
      discountPercentage: 10,
      eligible: true,
      freeShipping: false,
    },
    enabled: true,
  };

  it('renders rule title, id, priority, and condition', () => {
    render(<RuleCard rule={sampleRule} />);

    expect(screen.getByText('RULE-202')).toBeInTheDocument();
    expect(screen.getByText('Gold Member Threshold Incentive')).toBeInTheDocument();
    expect(screen.getByText('Priority 2')).toBeInTheDocument();
    expect(screen.getByText(/customerTier/i)).toBeInTheDocument();
  });

  it('renders badge with correct text content', () => {
    render(<Badge variant="emerald">PROVEN UNSAT</Badge>);
    expect(screen.getByText('PROVEN UNSAT')).toBeInTheDocument();
  });
});
