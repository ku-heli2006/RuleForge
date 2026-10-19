import { describe, it, expect } from 'vitest';
import { validateRuleExpressionAdvisory, tokenizeExpression } from '../lib/dsl-parser';

describe('DSL Parser & Advisory Checker', () => {
  it('validates a correct condition expression with AND operator', () => {
    const expr = 'customerTier == GOLD AND orderAmount > 5000';
    const result = validateRuleExpressionAdvisory(expr);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects unclosed parentheses', () => {
    const expr = '(customerTier == PLATINUM AND (orderAmount > 2000)';
    const result = validateRuleExpressionAdvisory(expr);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unclosed parenthesis');
  });

  it('detects unmatched closing parentheses', () => {
    const expr = 'customerTier == GOLD) AND orderAmount > 1000';
    const result = validateRuleExpressionAdvisory(expr);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unmatched closing parenthesis');
  });

  it('detects accidental single equals assignment operator', () => {
    const expr = 'customerTier = GOLD AND orderAmount > 1000';
    const result = validateRuleExpressionAdvisory(expr);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Single '=' assignment operator detected");
  });

  it('warns when using && instead of AND keyword', () => {
    const expr = 'customerTier == GOLD && orderAmount > 1000';
    const result = validateRuleExpressionAdvisory(expr);
    expect(result.warnings.some((w) => w.includes("Use 'AND' keyword"))).toBe(true);
  });

  it('tokenizes keywords, operators, fields, and values', () => {
    const expr = 'creditScore >= 720 AND isFirstOrder == true';
    const tokens = tokenizeExpression(expr);
    
    expect(tokens.some((t) => t.type === 'field' && t.text === 'creditScore')).toBe(true);
    expect(tokens.some((t) => t.type === 'operator' && t.text === '>=')).toBe(true);
    expect(tokens.some((t) => t.type === 'keyword' && t.text === 'AND')).toBe(true);
    expect(tokens.some((t) => t.type === 'value' && t.text === '720')).toBe(true);
  });
});
