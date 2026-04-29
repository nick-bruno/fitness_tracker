import type {
  Exercise,
  MuscleGroup,
  WorkoutDetail,
  WorkoutSummary,
  MuscleVolumeSummary,
  RecommendationResponse,
  WorkoutCreateInput,
} from '../types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Muscle Groups
export const fetchMuscleGroups = () =>
  request<{ groups: MuscleGroup[] }>('/muscle-groups').then((r) => r.groups);

// Exercises
export const fetchExercises = (params: {
  search?: string;
  muscleGroupId?: number;
  equipment?: string;
  role?: 'primary' | 'secondary';
}) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.muscleGroupId != null) qs.set('muscleGroupId', String(params.muscleGroupId));
  if (params.equipment) qs.set('equipment', params.equipment);
  if (params.role) qs.set('role', params.role);
  return request<{ exercises: Exercise[] }>(`/exercises?${qs}`).then((r) => r.exercises);
};

export const fetchExercise = (id: number) =>
  request<{ exercise: Exercise }>(`/exercises/${id}`).then((r) => r.exercise);

export const createExercise = (data: Omit<Exercise, 'id' | 'created_at'> & { muscles: { muscle_group_id: number; role: 'primary' | 'secondary' }[] }) =>
  request<{ exercise: Exercise }>('/exercises', { method: 'POST', ...json(data) }).then((r) => r.exercise);

export const deleteExercise = (id: number) =>
  request<{ success: boolean }>(`/exercises/${id}`, { method: 'DELETE' });

// Workouts
export const fetchWorkouts = (params: {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}) => {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  return request<{ workouts: WorkoutSummary[]; total: number }>(`/workouts?${qs}`);
};

export const fetchWorkout = (id: number) =>
  request<{ workout: WorkoutDetail }>(`/workouts/${id}`).then((r) => r.workout);

export const createWorkout = (data: WorkoutCreateInput) =>
  request<{ workout: WorkoutDetail }>('/workouts', { method: 'POST', ...json(data) }).then((r) => r.workout);

export const updateWorkout = (id: number, data: WorkoutCreateInput) =>
  request<{ workout: WorkoutDetail }>(`/workouts/${id}`, { method: 'PUT', ...json(data) }).then((r) => r.workout);

export const deleteWorkout = (id: number) =>
  request<{ success: boolean }>(`/workouts/${id}`, { method: 'DELETE' });

// Muscle summary
export const fetchMuscleSummary = (days: number) =>
  request<{ summary: MuscleVolumeSummary[] }>(`/workouts/muscle-summary?days=${days}`).then(
    (r) => r.summary,
  );

// Recommendations
export const fetchRecommendation = (goals: string[], lookback_days: number) =>
  request<{ recommendation: RecommendationResponse }>('/recommendations', {
    method: 'POST',
    ...json({ goals, lookback_days }),
  }).then((r) => r.recommendation);
