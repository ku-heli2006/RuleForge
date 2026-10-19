import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { CounterfactualRequest, CounterfactualResponse } from '../types/counterfactual';

export async function getCounterfactuals(
  request: CounterfactualRequest
): Promise<CounterfactualResponse> {
  if (isDemoMode()) {
    return mockApi.getCounterfactuals(request);
  }
  return apiClient<CounterfactualResponse>(`/rulesets/${request.rulesetId}/counterfactual`, {
    method: 'POST',
    body: JSON.stringify({
      version: request.version,
      originalInput: request.originalInput,
      targetOutcome: request.targetOutcome,
      maxSearchCost: request.maxSearchCost,
    }),
  });
}
