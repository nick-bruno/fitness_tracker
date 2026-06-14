import { Router } from 'express';
import { z } from 'zod';
import { getGoalsWithProgress, updateGoals, getGoalsHistory } from '../services/goalService';

const router = Router();

const GoalsSchema = z.object({
  strength_goal: z.number().int().min(0).max(99),
  cardio_goal: z.number().int().min(0).max(99),
});

router.get('/history', (req, res) => {
  const limit = Math.min(parseInt((req.query.weeks as string) ?? '12'), 52);
  res.json({ history: getGoalsHistory(limit) });
});

router.get('/', (_req, res) => {
  res.json({ goals: getGoalsWithProgress() });
});

router.put('/', (req, res) => {
  const parsed = GoalsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const { strength_goal, cardio_goal } = parsed.data;
  res.json({ goals: updateGoals(strength_goal, cardio_goal) });
});

export default router;
