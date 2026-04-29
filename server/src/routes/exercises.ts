import { Router } from 'express';
import { z } from 'zod';
import {
  listExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../services/exerciseService';

const router = Router();

const MuscleInput = z.object({
  muscle_group_id: z.number().int().positive(),
  role: z.enum(['primary', 'secondary']),
});

const CreateExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  equipment: z.enum(['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight']),
  movement_pattern: z.enum(['Push', 'Pull', 'Hinge', 'Squat', 'Carry', 'Isolation']),
  muscles: z.array(MuscleInput).min(1),
});

const UpdateExerciseSchema = CreateExerciseSchema.partial();

router.get('/', (req, res) => {
  const { search, muscleGroupId, equipment, role } = req.query as Record<string, string | undefined>;
  const exercises = listExercises({
    search,
    muscleGroupId: muscleGroupId ? parseInt(muscleGroupId) : undefined,
    equipment,
    role: role as 'primary' | 'secondary' | undefined,
  });
  res.json({ exercises });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const exercise = getExerciseById(id);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ exercise });
});

router.post('/', (req, res) => {
  const parsed = CreateExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  try {
    const exercise = createExercise(parsed.data);
    res.status(201).json({ exercise });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) return res.status(409).json({ error: 'Exercise name already exists' });
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateExerciseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const exercise = updateExercise(id, parsed.data);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ exercise });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteExercise(id);
  if (!deleted) return res.status(404).json({ error: 'Exercise not found' });
  res.json({ success: true });
});

export default router;
