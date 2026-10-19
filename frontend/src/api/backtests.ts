import { apiClient, isDemoMode, mockApi } from '../lib/api-client';
import { BacktestJob, BacktestRequest } from '../types/backtest';

export async function runBacktest(request: BacktestRequest): Promise<BacktestJob> {
  if (isDemoMode()) {
    return mockApi.runBacktest(request);
  }
  return apiClient<BacktestJob>('/backtests', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getBacktest(id: string): Promise<BacktestJob> {
  if (isDemoMode()) {
    return mockApi.getBacktest(id);
  }
  return apiClient<BacktestJob>(`/backtests/${id}`);
}

export async function exportBacktestCsv(id: string): Promise<string> {
  if (isDemoMode()) {
    return mockApi.exportBacktestCsv(id);
  }
  return apiClient<string>(`/backtests/${id}/export`);
}
