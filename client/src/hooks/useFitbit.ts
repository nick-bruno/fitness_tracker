import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFitbitStatus, triggerFitbitSync, disconnectFitbit, fetchFitbitSteps } from '../api/client';

export function useFitbitStatus() {
  return useQuery({
    queryKey: ['fitbit-status'],
    queryFn: fetchFitbitStatus,
    refetchInterval: 60_000,
  });
}

export function useSyncFitbit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerFitbitSync,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['runs-summary'] });
      qc.invalidateQueries({ queryKey: ['fitbit-status'] });
      qc.invalidateQueries({ queryKey: ['fitbit-steps'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDisconnectFitbit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectFitbit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fitbit-status'] });
      qc.invalidateQueries({ queryKey: ['fitbit-steps'] });
    },
  });
}

export function useFitbitSteps(days: number) {
  return useQuery({
    queryKey: ['fitbit-steps', days],
    queryFn: () => fetchFitbitSteps(days),
  });
}
