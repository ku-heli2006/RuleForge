import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { EvaluationInput, EvaluationResult } from '../types/evaluation';

export async function evaluateRuleset(
  id: string,
  input: EvaluationInput,
  version?: string
): Promise<EvaluationResult> {
  if (isDemoMode()) {
    return mockApi.evaluateRuleset(id, input, version);
  }
  return apiClient<EvaluationResult>(`/rulesets/${id}/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ input, version }),
  });
}
