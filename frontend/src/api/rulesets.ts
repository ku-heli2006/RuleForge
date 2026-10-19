import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { Ruleset, CreateRulesetInput, UpdateRulesetInput, Rule } from '../types/ruleset';
import { RuleValidationResponse } from '../types/api';

export async function getRulesets(): Promise<Ruleset[]> {
  if (isDemoMode()) {
    return mockApi.getRulesets();
  }
  return apiClient<Ruleset[]>('/rulesets');
}

export async function getRuleset(id: string): Promise<Ruleset> {
  if (isDemoMode()) {
    return mockApi.getRuleset(id);
  }
  return apiClient<Ruleset>(`/rulesets/${id}`);
}

export async function createRuleset(input: CreateRulesetInput): Promise<Ruleset> {
  if (isDemoMode()) {
    return mockApi.createRuleset(input);
  }
  return apiClient<Ruleset>('/rulesets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateRuleset(id: string, input: UpdateRulesetInput): Promise<Ruleset> {
  if (isDemoMode()) {
    return mockApi.updateRuleset(id, input);
  }
  return apiClient<Ruleset>(`/rulesets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function validateRuleset(id: string, rules: Rule[]): Promise<RuleValidationResponse> {
  if (isDemoMode()) {
    return mockApi.validateRuleset(id, rules);
  }
  return apiClient<RuleValidationResponse>(`/rulesets/${id}/validate`, {
    method: 'POST',
    body: JSON.stringify({ rules }),
  });
}
