import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runBacktest, getBacktest, exportBacktestCsv } from '../api/backtests';
import { BacktestRequest } from '../types/backtest';
import { useToast } from '../context/ToastContext';
import { useDemoMode } from '../context/DemoModeContext';

export function useRunBacktest() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (request: BacktestRequest) => runBacktest(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['backtest', data.id], data);
      success('Backtest Analysis Completed', `Processed ${data.recordsProcessed.toLocaleString()} historical records.`);
    },
    onError: (err: Error) => {
      error('Backtest Failed', err.message);
    },
  });
}

export function useBacktestJob(id: string | null) {
  const { isDemo } = useDemoMode();

  return useQuery({
    queryKey: ['backtest', id, { isDemo }],
    queryFn: () => getBacktest(id!),
    enabled: Boolean(id),
    // If running, poll every 2s until completed or failed
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'RUNNING' || data.status === 'PENDING')) {
        return 2000;
      }
      return false;
    },
  });
}

export function useExportBacktestCsv() {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => exportBacktestCsv(id),
    onSuccess: (csvData, id) => {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ruleforge_backtest_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('Export Completed', 'Backtest results exported to CSV.');
    },
    onError: (err: Error) => {
      error('Export Failed', err.message);
    },
  });
}
