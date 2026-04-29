import { Router } from 'express';
import { z } from 'zod';
import { getRecommendation } from '../services/claudeService';
import { getMuscleVolumeSummary, getRecentWorkoutsForAI } from '../services/workoutService';
import { getExerciseLibraryForAI } from '../services/exerciseService';

const router = Router();

const RecommendationSchema = z.object({
  goals: z.array(z.string()).min(1),
  lookback_days: z.number().int().min(1).max(90).default(14),
});

router.post('/', async (req, res) => {
  const parsed = RecommendationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });

  const { goals, lookback_days } = parsed.data;

  try {
    const [muscleVolume, recentWorkouts, exerciseLibrary] = [
      getMuscleVolumeSummary(lookback_days),
      getRecentWorkoutsForAI(lookback_days),
      getExerciseLibraryForAI(),
    ];

    const recommendation = await getRecommendation(
      goals,
      lookback_days,
      muscleVolume,
      recentWorkouts,
      exerciseLibrary,
    );

    res.json({ recommendation });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Set ANTHROPIC_API_KEY in .env' });
    }
    console.error('Recommendation error:', msg);
    res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
});

export default router;
