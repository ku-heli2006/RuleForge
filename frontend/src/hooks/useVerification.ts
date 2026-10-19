import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyRuleset } from '../api/verification';
import { VerificationRequest } from '../types/verification';
import { useToast } from '../context/ToastContext';

export function useVerifyRuleset() {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  return useMutation({
    mutationFn: ({ id, options }: { id: string; options?: VerificationRequest['options'] }) =>
      verifyRuleset(id, options),
    onSuccess: (data) => {
      queryClient.setQueryData(['verification', data.rulesetId, data.version], data);
      queryClient.invalidateQueries({ queryKey: ['rulesets'] });
      
      if (data.solverStatus === 'SAT') {
        warning(
          'Verification Complete: SAT (Witness Found)',
          `Found ${data.summary.totalFindings} issue(s) including ${data.summary.conflictCount} conflict(s).`
        );
      } else if (data.solverStatus === 'UNSAT') {
        success(
          'Verification Complete: UNSAT (Proven Safe)',
          'No counterexamples or conflicting rule executions found.'
        );
      } else {
        warning(
          'Verification Inconclusive: UNKNOWN',
          'The solver could not determine satisfiability within the configured bounds.'
        );
      }
    },
    onError: (err: Error) => {
      error('Verification Error', err.message);
    },
  });
}
