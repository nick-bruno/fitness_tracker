import db from '../db';
import type { Run, RunCreateInput, RunWeeklySummary } from '../types';

type P = Record<string, string | number | null | bigint>;

const MISC_TYPES_SQL = "('tennis', 'golf', 'pickleball', 'cycle', 'swim', 'walk')";

export function listRuns(opts: {
  limit: number;
  offset: number;
  type?: string;
  from?: string;
  to?: string;
}): { runs: Run[]; total: number } {
  const conditions: string[] = [];
  const filterParams: P = {};

  if (opts.type === 'activity') {
    conditions.push(`type IN ${MISC_TYPES_SQL}`);
  } else if (opts.type) {
    conditions.push('type = $type');
    filterParams['type'] = opts.type;
  }
  if (opts.from) {
    conditions.push('logged_at >= $from');
    filterParams['from'] = opts.from;
  }
  if (opts.to) {
    conditions.push('logged_at <= $to');
    filterParams['to'] = opts.to;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageParams: P = { ...filterParams, limit: opts.limit, offset: opts.offset };

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM runs ${where}`).get(filterParams) as unknown as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT id, type, title, logged_at, distance_miles, duration_seconds, notes, source, external_id
       FROM runs ${where}
       ORDER BY logged_at DESC
       LIMIT $limit OFFSET $offset`,
    )
    .all(pageParams) as unknown as Run[];

  return { runs: rows, total };
}

export function getRunById(id: number): Run | undefined {
  return db
    .prepare('SELECT id, type, title, logged_at, distance_miles, duration_seconds, notes, source, external_id FROM runs WHERE id = $id')
    .get({ id }) as unknown as Run | undefined;
}

export function runExistsByExternalId(externalId: string): boolean {
  const row = db
    .prepare('SELECT 1 FROM runs WHERE external_id = $externalId')
    .get({ externalId }) as unknown as { 1: number } | undefined;
  return row != null;
}

export function createRun(data: RunCreateInput): Run {
  const result = db
    .prepare(
      'INSERT INTO runs (type, title, logged_at, distance_miles, duration_seconds, notes, source, external_id) VALUES ($type, $title, $logged_at, $distance_miles, $duration_seconds, $notes, $source, $external_id)',
    )
    .run({
      type: data.type,
      title: data.title ?? null,
      logged_at: data.logged_at ?? new Date().toISOString(),
      distance_miles: data.distance_miles ?? null,
      duration_seconds: data.duration_seconds,
      notes: data.notes ?? null,
      source: data.source ?? 'manual',
      external_id: data.external_id ?? null,
    }) as { lastInsertRowid: number };

  return getRunById(result.lastInsertRowid)!;
}

export function updateRun(id: number, data: RunCreateInput): Run | undefined {
  if (!getRunById(id)) return undefined;

  db.prepare(
    'UPDATE runs SET title = $title, logged_at = $logged_at, distance_miles = $distance_miles, duration_seconds = $duration_seconds, notes = $notes WHERE id = $id',
  ).run({
    id,
    title: data.title ?? null,
    logged_at: data.logged_at ?? new Date().toISOString(),
    distance_miles: data.distance_miles ?? null,
    duration_seconds: data.duration_seconds,
    notes: data.notes ?? null,
  });

  return getRunById(id);
}

export function deleteRun(id: number): boolean {
  const result = db.prepare('DELETE FROM runs WHERE id = $id').run({ id }) as { changes: number };
  return result.changes > 0;
}

export function getRunsSummary(lookbackDays: number, type: string): RunWeeklySummary {
  const isActivityGroup = type === 'activity';
  const typeFilter = isActivityGroup ? `type IN ${MISC_TYPES_SQL}` : 'type = $type';
  const params = isActivityGroup
    ? { days: `-${lookbackDays} days` }
    : { type, days: `-${lookbackDays} days` };

  return db
    .prepare(
      `SELECT
         COUNT(*) AS total_runs,
         COALESCE(SUM(distance_miles), 0) AS total_miles,
         COALESCE(SUM(duration_seconds), 0) AS total_seconds
       FROM runs
       WHERE ${typeFilter} AND logged_at >= datetime('now', $days)`,
    )
    .get(params as P) as unknown as RunWeeklySummary;
}
