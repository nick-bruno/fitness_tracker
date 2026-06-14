import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, updateGoals, fetchGoalsHistory } from '../api/client';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    // Refresh every minute so the completed counts stay current
    refetchInterval: 60_000,
  });
}

export function useGoalsHistory(weeks = 12) {
  return useQuery({
    queryKey: ['goals-history', weeks],
    queryFn: () => fetchGoalsHistory(weeks),
  });
}

export function useUpdateGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strength_goal, cardio_goal }: { strength_goal: number; cardio_goal: number }) =>
      updateGoals(strength_goal, cardio_goal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
