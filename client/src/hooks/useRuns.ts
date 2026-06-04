import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRuns, fetchRun, createRun, updateRun, deleteRun, fetchRunsSummary, importNrcRuns } from '../api/client';
import type { RunCreateInput } from '../types';

export function useRuns(params: { limit?: number; offset?: number; from?: string; to?: string; type?: string }) {
  return useQuery({
    queryKey: ['runs', params],
    queryFn: () => fetchRuns(params),
  });
}

export function useRun(id: number | undefined) {
  return useQuery({
    queryKey: ['run', id],
    queryFn: () => fetchRun(id!),
    enabled: id != null,
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RunCreateInput) => createRun(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['runs-summary'] });
    },
  });
}

export function useUpdateRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RunCreateInput }) => updateRun(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useDeleteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRun,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['runs-summary'] });
    },
  });
}

export function useRunsSummary(days: number, type: 'run' | 'row') {
  return useQuery({
    queryKey: ['runs-summary', days, type],
    queryFn: () => fetchRunsSummary(days, type),
  });
}

export function useImportNrcRuns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importNrcRuns(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['runs-summary'] });
    },
  });
}
