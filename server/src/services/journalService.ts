import db from '../db';

type P = Record<string, string | number | null | bigint>;

export interface JournalEntry {
  id: number;
  date: string; // YYYY-MM-DD
  rating: number | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export function listJournalEntries(limit = 30, offset = 0): { entries: JournalEntry[]; total: number } {
  const entries = db
    .prepare('SELECT * FROM journal_entries ORDER BY date DESC LIMIT $limit OFFSET $offset')
    .all({ limit, offset } as P) as unknown as JournalEntry[];
  const total = (db.prepare('SELECT COUNT(*) AS c FROM journal_entries').get() as unknown as { c: number }).c;
  return { entries, total };
}

export function getJournalEntry(date: string): JournalEntry | undefined {
  return db
    .prepare('SELECT * FROM journal_entries WHERE date = $date')
    .get({ date } as P) as unknown as JournalEntry | undefined;
}

export function upsertJournalEntry(date: string, rating: number | null, body: string): JournalEntry {
  db.prepare(`
    INSERT INTO journal_entries (date, rating, body) VALUES ($date, $rating, $body)
    ON CONFLICT(date) DO UPDATE SET
      rating = excluded.rating,
      body = excluded.body,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  `).run({ date, rating, body } as P);
  return getJournalEntry(date)!;
}

export function deleteJournalEntry(date: string): boolean {
  const result = db.prepare('DELETE FROM journal_entries WHERE date = $date').run({ date } as P) as { changes: number };
  return result.changes > 0;
}
