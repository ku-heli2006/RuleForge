import { useMutation } from '@tanstack/react-query';
import { evaluateRuleset } from '../api/evaluations';
import { EvaluationInput } from '../types/evaluation';
import { useToast } from '../context/ToastContext';

export function useEvaluateRuleset() {
  const { error } = useToast();

  return useMutation({
    mutationFn: ({ id, input, version }: { id: string; input: EvaluationInput; version?: string }) =>
      evaluateRuleset(id, input, version),
    onError: (err: Error) => {
      error('Evaluation Failed', err.message);
    },
  });
}
