import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGoals, updateGoals, fetchGoalsHistory } from '../api/client';
import type { WeeklyGoalValues } from '../types';

export function useGoals(offset = 0, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['goals', offset],
    queryFn: () => fetchGoals(offset),
    refetchInterval: offset === 0 ? 60_000 : false,
    enabled: options.enabled ?? true,
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
    mutationFn: ({ goals, week_offset = 0 }: { goals: WeeklyGoalValues; week_offset?: number }) =>
      updateGoals(goals, week_offset),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goals-history'] });
    },
  });
}
