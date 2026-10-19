import { describe, it, expect } from 'vitest';
import { simulateMockEvaluation } from '../mock/mock-data';

describe('Evaluation & Decision Simulation Engine', () => {
  it('applies 20% discount for Platinum members with cart > 5000', () => {
    const result = simulateMockEvaluation('rs-ecommerce-discounts', {
      customerTier: 'PLATINUM',
      orderAmount: 6000,
      creditScore: 700,
      customerAge: 35,
      region: 'US_EAST',
      isFirstOrder: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.discountPercentage).toBe(20);
    expect(result.matchedRules.some((r) => r.id === 'RULE-101')).toBe(true);
  });

  it('applies 10% discount for Gold members with cart > 2500', () => {
    const result = simulateMockEvaluation('rs-ecommerce-discounts', {
      customerTier: 'GOLD',
      orderAmount: 3000,
      creditScore: 680,
      customerAge: 30,
      region: 'US_WEST',
      isFirstOrder: false,
    });

    expect(result.eligible).toBe(true);
    expect(result.discountPercentage).toBe(10);
    expect(result.matchedRules.some((r) => r.id === 'RULE-102')).toBe(true);
  });

  it('marks subprime returning customer with credit score < 550 as ineligible', () => {
    const result = simulateMockEvaluation('rs-ecommerce-discounts', {
      customerTier: 'BRONZE',
      orderAmount: 800,
      creditScore: 490,
      customerAge: 25,
      region: 'APAC',
      isFirstOrder: false,
    });

    expect(result.eligible).toBe(false);
    expect(result.discountPercentage).toBe(0);
    expect(result.matchedRules.some((r) => r.id === 'RULE-105')).toBe(true);
  });
});
