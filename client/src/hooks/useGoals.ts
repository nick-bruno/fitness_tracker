import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, updateGoals, fetchGoalsHistory } from '../api/client';

export function useGoals(offset = 0) {
  return useQuery({
    queryKey: ['goals', offset],
    queryFn: () => fetchGoals(offset),
    refetchInterval: offset === 0 ? 60_000 : false,
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
    mutationFn: ({ strength_goal, cardio_goal, week_offset = 0 }: { strength_goal: number; cardio_goal: number; week_offset?: number }) =>
      updateGoals(strength_goal, cardio_goal, week_offset),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['goals', vars.week_offset ?? 0] });
    },
  });
}
