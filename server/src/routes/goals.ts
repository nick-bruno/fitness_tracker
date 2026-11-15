import { Router } from 'express';
import { z } from 'zod';
import { getGoalsWithProgress, updateGoals, getGoalsHistory } from '../services/goalService';

const router = Router();

const goalValue = z.number().int().min(0).max(99).nullable();

const GoalsSchema = z.object({
  strength_goal: goalValue,
  cardio_goal: goalValue,
  golf_goal: goalValue,
  week_offset: z.number().int().min(0).max(8).optional().default(0),
});

router.get('/history', (req, res) => {
  const limit = Math.max(1, Math.min(parseInt((req.query.weeks as string) ?? '12') || 12, 52));
  res.json({ history: getGoalsHistory(limit) });
});

router.get('/', (req, res) => {
  const offset = Math.max(0, Math.min(8, parseInt((req.query.offset as string) ?? '0') || 0));
  res.json({ goals: getGoalsWithProgress(offset) });
});

router.put('/', (req, res) => {
  const parsed = GoalsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const { week_offset, ...goals } = parsed.data;
  res.json({ goals: updateGoals(goals, week_offset) });
});

export default router;
