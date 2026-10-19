import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { VerificationResponse, VerificationRequest } from '../types/verification';

export async function verifyRuleset(
  id: string,
  options?: VerificationRequest['options']
): Promise<VerificationResponse> {
  if (isDemoMode()) {
    return mockApi.verifyRuleset(id, options);
  }
  return apiClient<VerificationResponse>(`/rulesets/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}
