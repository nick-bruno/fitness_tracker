import { Router } from 'express';
import { z } from 'zod';
import {
  listWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getMuscleVolumeSummary,
} from '../services/workoutService';

const router = Router();

const SetInputSchema = z.object({
  set_number: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weight_lb: z.number().positive().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const WorkoutExerciseSchema = z.object({
  exercise_id: z.number().int().positive(),
  sort_order: z.number().int().min(0),
  sets: z.array(SetInputSchema).min(1),
});

const WorkoutSchema = z.object({
  title: z.string().optional(),
  logged_at: z.string().datetime().optional(),
  notes: z.string().optional(),
  exercises: z.array(WorkoutExerciseSchema).min(1),
});

router.get('/muscle-summary', (req, res) => {
  const { days = '7' } = req.query as { days?: string };
  const summary = getMuscleVolumeSummary(parseInt(days));
  res.json({ summary });
});

router.get('/', (req, res) => {
  const { limit = '20', offset = '0', from, to } = req.query as Record<string, string | undefined>;
  const result = listWorkouts({
    limit: parseInt(limit),
    offset: parseInt(offset),
    from,
    to,
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const workout = getWorkoutById(id);
  if (!workout) return res.status(404).json({ error: 'Workout not found' });
  res.json({ workout });
});

router.post('/', (req, res) => {
  const parsed = WorkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const workout = createWorkout(parsed.data);
  res.status(201).json({ workout });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = WorkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const workout = updateWorkout(id, parsed.data);
  if (!workout) return res.status(404).json({ error: 'Workout not found' });
  res.json({ workout });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteWorkout(id);
  if (!deleted) return res.status(404).json({ error: 'Workout not found' });
  res.json({ success: true });
});

export default router;
