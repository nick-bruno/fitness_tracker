export interface MuscleGroup {
  id: number;
  name: string;
  parent_id: number | null;
  children: MuscleGroup[];
}

export interface ExerciseMuscle {
  muscle_group_id: number;
  muscle_group_name: string;
  parent_id: number | null;
  parent_name: string | null;
  role: 'primary' | 'secondary';
}

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  equipment: string;
  movement_pattern: string;
  created_at: string;
  muscles: ExerciseMuscle[];
}

export interface SetEntry {
  id: number;
  set_number: number;
  reps: number | null;
  weight_lb: number | null;
  rpe: number | null;
  notes: string | null;
}

export interface WorkoutExerciseDetail {
  workout_exercise_id: number;
  exercise_id: number;
  exercise_name: string;
  sort_order: number;
  muscles: { muscle_group_name: string; role: string }[];
  sets: SetEntry[];
}

export interface WorkoutDetail {
  id: number;
  title: string | null;
  logged_at: string;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutSummary {
  id: number;
  title: string | null;
  logged_at: string;
  notes: string | null;
  exercise_count: number;
  total_sets: number;
  exercise_names: string[];
}

export interface MuscleVolumeSummary {
  muscle_group_name: string;
  parent_name: string | null;
  total_sets: number;
  last_trained_date: string | null;
}

export interface TargetMuscleGroup {
  muscle_group_name: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SuggestedExercise {
  exercise_id: number | null;
  exercise_name: string;
  sets: number;
  rep_range: string;
  rationale: string;
}

export interface RecommendationResponse {
  target_muscle_groups: TargetMuscleGroup[];
  suggested_exercises: SuggestedExercise[];
  overall_reasoning: string;
  generated_at: string;
}

export interface SetInput {
  set_number: number;
  reps?: number;
  weight_lb?: number;
  rpe?: number;
}

export interface WorkoutExerciseInput {
  exercise_id: number;
  sort_order: number;
  sets: SetInput[];
}

export interface WorkoutCreateInput {
  title?: string;
  logged_at?: string;
  notes?: string;
  exercises: WorkoutExerciseInput[];
}
