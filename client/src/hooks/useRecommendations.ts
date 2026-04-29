import { useMutation } from '@tanstack/react-query';
import { fetchRecommendation } from '../api/client';

export function useRecommendation() {
  return useMutation({
    mutationFn: ({ goals, lookback_days }: { goals: string[]; lookback_days: number }) =>
      fetchRecommendation(goals, lookback_days),
  });
}
