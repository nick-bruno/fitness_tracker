import { Router } from 'express';
import { z } from 'zod';
import { listRuns, getRunById, createRun, updateRun, deleteRun, getRunsSummary } from '../services/runsService';

const router = Router();

const MISC_ACTIVITY_TYPES = ['tennis', 'golf', 'pickleball'] as const;

const RunSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum(['run', 'row']),
    title: z.string().optional(),
    logged_at: z.string().datetime().optional(),
    distance_miles: z.number().positive(),
    duration_seconds: z.number().int().positive(),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.enum(MISC_ACTIVITY_TYPES),
    title: z.string().optional(),
    logged_at: z.string().datetime().optional(),
    distance_miles: z.number().optional(),
    duration_seconds: z.number().int().positive(),
    notes: z.string().optional(),
  }),
]);

// Must come before /:id so "summary" isn't parsed as an ID
router.get('/summary', (req, res) => {
  const { days = '7', type = 'run' } = req.query as { days?: string; type?: string };
  const summary = getRunsSummary(parseInt(days), type);
  res.json({ summary });
});

router.get('/', (req, res) => {
  const { limit = '20', offset = '0', from, to, type } = req.query as Record<string, string | undefined>;
  const result = listRuns({ limit: parseInt(limit), offset: parseInt(offset), from, to, type });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const run = getRunById(id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json({ run });
});

router.post('/', (req, res) => {
  const parsed = RunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const run = createRun(parsed.data);
  res.status(201).json({ run });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = RunSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  const run = updateRun(id, parsed.data);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json({ run });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = deleteRun(id);
  if (!deleted) return res.status(404).json({ error: 'Run not found' });
  res.json({ success: true });
});

export default router;
