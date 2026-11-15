import { Router } from 'express';
import { z } from 'zod';
import { getGoalsWithProgress, updateGoals, getGoalsHistory, getWeekActivities } from '../services/goalService';

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

const parseOffset = (raw: unknown) => Math.max(0, Math.min(8, parseInt((raw as string) ?? '0') || 0));

router.get('/activities', (req, res) => {
  res.json({ activities: getWeekActivities(parseOffset(req.query.offset)) });
});

router.get('/', (req, res) => {
  res.json({ goals: getGoalsWithProgress(parseOffset(req.query.offset)) });
});

router.put('/', (req, res) => {
  const parsed = GoalsSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const { week_offset, ...goals } = parsed.data;
  res.json({ goals: updateGoals(goals, week_offset) });
});

export default router;
