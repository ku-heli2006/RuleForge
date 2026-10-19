import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { HealthStatus } from '../types/api';

export async function getHealthStatus(): Promise<HealthStatus> {
  if (isDemoMode()) {
    return mockApi.getHealth();
  }
  return apiClient<HealthStatus>('/health');
}
