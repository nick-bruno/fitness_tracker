import db from '../db';

type P = Record<string, string | number | null | bigint>;

// Weeks run Monday 00:00 → Sunday 23:59:59 local time, stored as ISO (UTC) strings.
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

export interface WeeklyGoalValues {
  strength_goal: number | null;
  cardio_goal: number | null;
  golf_goal: number | null;
}

interface Completions {
  strength_completed: number;
  cardio_completed: number;
  golf_completed: number;
}

export interface GoalsWithProgress extends WeeklyGoalValues, Completions {
  week_start: string;
  week_end: string;
  /** True once all three goals have been predicted for the week. */
  goals_set: boolean;
}

export interface WeekHistoryRecord extends GoalsWithProgress {
  /** null when no goal was set for that category */
  strength_met: boolean | null;
  cardio_met: boolean | null;
  golf_met: boolean | null;
}

const EMPTY_GOALS: WeeklyGoalValues = { strength_goal: null, cardio_goal: null, golf_goal: null };

function getGoalRow(weekStart: string): WeeklyGoalValues {
  const row = db
    .prepare('SELECT strength_goal, cardio_goal, golf_goal FROM weekly_goals WHERE week_start = $from')
    .get({ from: weekStart } as P) as unknown as WeeklyGoalValues | undefined;
  return row ?? EMPTY_GOALS;
}

// Lift = any logged workout. Cardio = any runs-table activity except golf. Golf = type 'golf'.
function countCompletions(from: string, to: string): Completions {
  const strength = (db
    .prepare('SELECT COUNT(*) AS c FROM workouts WHERE logged_at >= $from AND logged_at <= $to')
    .get({ from, to } as P) as unknown as { c: number }).c;

  const runs = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'golf' THEN 0 ELSE 1 END), 0) AS cardio,
        COALESCE(SUM(CASE WHEN type = 'golf' THEN 1 ELSE 0 END), 0) AS golf
      FROM runs
      WHERE logged_at >= $from AND logged_at <= $to
    `)
    .get({ from, to } as P) as unknown as { cardio: number; golf: number };

  return { strength_completed: strength, cardio_completed: runs.cardio, golf_completed: runs.golf };
}

function buildWeek(offsetWeeks: number): GoalsWithProgress {
  const { from, to } = getWeekBounds(offsetWeeks);
  const goals = getGoalRow(from);
  return {
    ...goals,
    ...countCompletions(from, to),
    week_start: from,
    week_end: to,
    goals_set: goals.strength_goal !== null && goals.cardio_goal !== null && goals.golf_goal !== null,
  };
}

export function getGoalsWithProgress(offsetWeeks = 0): GoalsWithProgress {
  return buildWeek(offsetWeeks);
}

export function updateGoals(goals: WeeklyGoalValues, offsetWeeks = 0): GoalsWithProgress {
  const { from, to } = getWeekBounds(offsetWeeks);
  db.prepare(`
    INSERT INTO weekly_goals (week_start, week_end, strength_goal, cardio_goal, golf_goal)
    VALUES ($from, $to, $sg, $cg, $gg)
    ON CONFLICT(week_start) DO UPDATE SET
      strength_goal = excluded.strength_goal,
      cardio_goal   = excluded.cardio_goal,
      golf_goal     = excluded.golf_goal
  `).run({ from, to, sg: goals.strength_goal, cg: goals.cardio_goal, gg: goals.golf_goal } as P);
  return buildWeek(offsetWeeks);
}

const met = (completed: number, goal: number | null) => (goal === null ? null : completed >= goal);

/**
 * Completed weeks (most recent first), excluding the current week.
 * Every calendar week is included — even ones without goals — back to the earliest
 * recorded activity or goal, so the week-over-week view has no gaps.
 */
export function getGoalsHistory(limit = 12): WeekHistoryRecord[] {
  const earliest = (db.prepare(`
    SELECT MIN(d) AS d FROM (
      SELECT MIN(logged_at) AS d FROM workouts
      UNION ALL SELECT MIN(logged_at) FROM runs
      UNION ALL SELECT MIN(week_start) FROM weekly_goals
    )
  `).get() as unknown as { d: string | null }).d;
  if (!earliest) return [];

  const history: WeekHistoryRecord[] = [];
  for (let i = 1; i <= limit; i++) {
    const week = buildWeek(-i);
    if (week.week_end < earliest) break;
    history.push({
      ...week,
      strength_met: met(week.strength_completed, week.strength_goal),
      cardio_met: met(week.cardio_completed, week.cardio_goal),
      golf_met: met(week.golf_completed, week.golf_goal),
    });
  }
  return history;
}
