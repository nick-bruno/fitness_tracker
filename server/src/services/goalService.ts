import db from '../db';

type P = Record<string, string | number | null | bigint>;

function getWeekBounds(offsetWeeks = 0): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}

// Ensure a weekly_goals row exists for the given week.
// Seeds from the most recent existing week or the defaults table.
function ensureWeek(from: string, to: string): { strength_goal: number; cardio_goal: number } {
  const existing = db
    .prepare('SELECT strength_goal, cardio_goal FROM weekly_goals WHERE week_start = $from')
    .get({ from } as P) as unknown as { strength_goal: number; cardio_goal: number } | undefined;
  if (existing) return existing;

  // Use most recent past week, else fall back to defaults table
  const seed = (db
    .prepare('SELECT strength_goal, cardio_goal FROM weekly_goals ORDER BY week_start DESC LIMIT 1')
    .get() as unknown as { strength_goal: number; cardio_goal: number } | undefined)
    ?? (db
    .prepare('SELECT strength_goal, cardio_goal FROM goals WHERE id = 1')
    .get() as unknown as { strength_goal: number; cardio_goal: number })
    ?? { strength_goal: 4, cardio_goal: 3 };

  db.prepare(
    'INSERT INTO weekly_goals (week_start, week_end, strength_goal, cardio_goal) VALUES ($from, $to, $sg, $cg)'
  ).run({ from, to, sg: seed.strength_goal, cg: seed.cardio_goal } as P);

  return seed;
}

function countWorkouts(from: string, to: string): number {
  return (db
    .prepare('SELECT COUNT(*) AS c FROM workouts WHERE logged_at >= $from AND logged_at <= $to')
    .get({ from, to } as P) as unknown as { c: number }).c;
}

function countCardio(from: string, to: string): number {
  return (db
    .prepare('SELECT COUNT(*) AS c FROM runs WHERE logged_at >= $from AND logged_at <= $to')
    .get({ from, to } as P) as unknown as { c: number }).c;
}

export interface GoalsWithProgress {
  strength_goal: number;
  cardio_goal: number;
  strength_completed: number;
  cardio_completed: number;
  week_start: string;
  week_end: string;
}

export function getGoalsWithProgress(offsetWeeks = 0): GoalsWithProgress {
  const { from, to } = getWeekBounds(offsetWeeks);
  const goals = ensureWeek(from, to);
  return {
    strength_goal: goals.strength_goal,
    cardio_goal: goals.cardio_goal,
    strength_completed: countWorkouts(from, to),
    cardio_completed: countCardio(from, to),
    week_start: from,
    week_end: to,
  };
}

export function updateGoals(strength_goal: number, cardio_goal: number, offsetWeeks = 0): GoalsWithProgress {
  const { from, to } = getWeekBounds(offsetWeeks);
  ensureWeek(from, to);
  db.prepare(
    'UPDATE weekly_goals SET strength_goal = $sg, cardio_goal = $cg WHERE week_start = $from'
  ).run({ sg: strength_goal, cg: cardio_goal, from } as P);
  // Only sync defaults for the current week so future weeks inherit it
  if (offsetWeeks === 0) {
    db.prepare(
      'UPDATE goals SET strength_goal = $sg, cardio_goal = $cg WHERE id = 1'
    ).run({ sg: strength_goal, cg: cardio_goal } as P);
  }
  return getGoalsWithProgress(offsetWeeks);
}

export interface WeekHistoryRecord {
  week_start: string;
  week_end: string;
  strength_goal: number;
  cardio_goal: number;
  strength_completed: number;
  cardio_completed: number;
  strength_met: boolean;
  cardio_met: boolean;
}

export function getGoalsHistory(limit = 12): WeekHistoryRecord[] {
  const { from } = getWeekBounds();

  // Correlated subqueries count completions for each stored week
  const rows = db.prepare(`
    SELECT
      wg.week_start, wg.week_end,
      wg.strength_goal, wg.cardio_goal,
      (SELECT COUNT(*) FROM workouts w
       WHERE w.logged_at >= wg.week_start AND w.logged_at <= wg.week_end) AS strength_completed,
      (SELECT COUNT(*) FROM runs r
       WHERE r.logged_at >= wg.week_start AND r.logged_at <= wg.week_end) AS cardio_completed
    FROM weekly_goals wg
    WHERE wg.week_start < $from
    ORDER BY wg.week_start DESC
    LIMIT $limit
  `).all({ from, limit } as P) as unknown as {
    week_start: string; week_end: string;
    strength_goal: number; cardio_goal: number;
    strength_completed: number; cardio_completed: number;
  }[];

  return rows.map(r => ({
    ...r,
    strength_met: r.strength_completed >= r.strength_goal,
    cardio_met: r.cardio_completed >= r.cardio_goal,
  }));
}
