import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkouts,
  fetchWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  fetchMuscleSummary,
} from '../api/client';
import type { WorkoutCreateInput } from '../types';

export function useWorkouts(params: {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => fetchWorkouts(params),
  });
}

export function useWorkout(id: number | undefined) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => fetchWorkout(id!),
    enabled: id != null,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkoutCreateInput) => createWorkout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['muscle-summary'] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkoutCreateInput }) => updateWorkout(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['muscle-summary'] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['muscle-summary'] });
    },
  });
}

export function useMuscleSummary(days: number) {
  return useQuery({
    queryKey: ['muscle-summary', days],
    queryFn: () => fetchMuscleSummary(days),
  });
}
