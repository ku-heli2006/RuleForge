import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRulesets, getRuleset, createRuleset, updateRuleset, validateRuleset } from '../api/rulesets';
import { CreateRulesetInput, UpdateRulesetInput, Rule } from '../types/ruleset';
import { useToast } from '../context/ToastContext';
import { useDemoMode } from '../context/DemoModeContext';

export function useRulesets() {
  const { isDemo } = useDemoMode();
  return useQuery({
    queryKey: ['rulesets', { isDemo }],
    queryFn: getRulesets,
    staleTime: 1000 * 30, // 30s
  });
}

export function useRuleset(id: string | undefined) {
  const { isDemo } = useDemoMode();
  return useQuery({
    queryKey: ['ruleset', id, { isDemo }],
    queryFn: () => getRuleset(id!),
    enabled: Boolean(id),
  });
}

export function useCreateRuleset() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (input: CreateRulesetInput) => createRuleset(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rulesets'] });
      success('Ruleset Created', `Ruleset "${data.name}" has been successfully created.`);
    },
    onError: (err: Error) => {
      error('Failed to Create Ruleset', err.message);
    },
  });
}

export function useUpdateRuleset(id: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (input: UpdateRulesetInput) => updateRuleset(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['ruleset', id], data);
      queryClient.invalidateQueries({ queryKey: ['rulesets'] });
      success('Ruleset Updated', `Changes to "${data.name}" have been saved.`);
    },
    onError: (err: Error) => {
      error('Failed to Update Ruleset', err.message);
    },
  });
}

export function useValidateRuleset(id: string) {
  const { success, error, warning } = useToast();

  return useMutation({
    mutationFn: (rules: Rule[]) => validateRuleset(id, rules),
    onSuccess: (data) => {
      if (data.valid) {
        success('Authoritative Validation Passed', `All ${data.parsedRulesCount} rules parsed and validated successfully.`);
      } else {
        warning(
          'Validation Issues Detected',
          `Found ${data.errors.length} error(s) and ${data.warnings.length} warning(s).`
        );
      }
    },
    onError: (err: Error) => {
      error('Validation Failed', err.message);
    },
  });
}
