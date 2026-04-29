import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExercises, fetchMuscleGroups, deleteExercise } from '../api/client';

export function useExercises(params: {
  search?: string;
  muscleGroupId?: number;
  equipment?: string;
  role?: 'primary' | 'secondary';
}) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: () => fetchExercises(params),
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle-groups'],
    queryFn: fetchMuscleGroups,
    staleTime: Infinity,
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}
