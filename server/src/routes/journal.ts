import { Router } from 'express';
import { z } from 'zod';
import { listJournalEntries, getJournalEntry, upsertJournalEntry, deleteJournalEntry } from '../services/journalService';

const router = Router();

const DateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const EntrySchema = z
  .object({
    rating: z.number().int().min(1).max(10).nullable(),
    body: z.string().max(50_000),
  })
  .refine((e) => e.rating !== null || e.body.trim() !== '', { message: 'Add a rating or some text' });

router.get('/', (req, res) => {
  const limit = Math.max(1, Math.min(parseInt((req.query.limit as string) ?? '30') || 30, 365));
  const offset = Math.max(0, parseInt((req.query.offset as string) ?? '0') || 0);
  res.json(listJournalEntries(limit, offset));
});

router.get('/:date', (req, res) => {
  const date = DateParam.safeParse(req.params.date);
  if (!date.success) return res.status(400).json({ error: date.error.issues[0].message });
  // 200 with null (not 404) so the client can treat "no entry yet" as a normal state
  res.json({ entry: getJournalEntry(date.data) ?? null });
});

router.put('/:date', (req, res) => {
  const date = DateParam.safeParse(req.params.date);
  if (!date.success) return res.status(400).json({ error: date.error.issues[0].message });
  const parsed = EntrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message, details: parsed.error.flatten() });
  res.json({ entry: upsertJournalEntry(date.data, parsed.data.rating, parsed.data.body) });
});

router.delete('/:date', (req, res) => {
  const date = DateParam.safeParse(req.params.date);
  if (!date.success) return res.status(400).json({ error: date.error.issues[0].message });
  if (!deleteJournalEntry(date.data)) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

export default router;
