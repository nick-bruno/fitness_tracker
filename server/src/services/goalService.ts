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

// Which runs-table activity types count toward each weekly goal (one session = one count).
// Anything not listed (walk, swim, pickleball…) counts toward nothing.
export const GOAL_ACTIVITY_TYPES = {
  strength: ['strength'],                                        // Fitbit "Strength training" (+ manually logged workouts)
  cardio:   ['run', 'basketball', 'cycle', 'row', 'tennis'],    // Run, Treadmill run, Basketball, Bike, Rowing, Tennis
  golf:     ['golf', 'driving_range'],                           // Golf, Driving range
} as const;

const sqlList = (types: readonly string[]) => `(${types.map((t) => `'${t}'`).join(', ')})`;

function countCompletions(from: string, to: string): Completions {
  const workouts = (db
    .prepare(`
      SELECT COUNT(*) AS c FROM workouts
      WHERE logged_at >= $from AND logged_at <= $to
        AND id NOT IN (SELECT workout_id FROM runs WHERE workout_id IS NOT NULL) -- linked ones count via their activity
    `)
    .get({ from, to } as P) as unknown as { c: number }).c;

  const runs = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ${sqlList(GOAL_ACTIVITY_TYPES.strength)} THEN 1 ELSE 0 END), 0) AS strength,
        COALESCE(SUM(CASE WHEN type IN ${sqlList(GOAL_ACTIVITY_TYPES.cardio)} THEN 1 ELSE 0 END), 0) AS cardio,
        COALESCE(SUM(CASE WHEN type IN ${sqlList(GOAL_ACTIVITY_TYPES.golf)} THEN 1 ELSE 0 END), 0) AS golf
      FROM runs
      WHERE logged_at >= $from AND logged_at <= $to
    `)
    .get({ from, to } as P) as unknown as { strength: number; cardio: number; golf: number };

  return { strength_completed: workouts + runs.strength, cardio_completed: runs.cardio, golf_completed: runs.golf };
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

export interface GoalActivity {
  /** 'activity' = runs table (Fitbit or manual), 'workout' = manually logged strength workout */
  kind: 'activity' | 'workout';
  id: number;
  type: string;
  title: string | null;
  logged_at: string;
  duration_seconds: number | null;
  distance_miles: number | null;
  notes: string | null;
  source: string;
  /** Linked workout (strength details) — null when no details added */
  workout_id: number | null;
  workout_title: string | null;
  exercise_names: string | null;
  set_count: number | null;
}

export type WeekActivities = Record<'strength' | 'cardio' | 'golf', GoalActivity[]>;

/** The individual sessions behind each weekly goal count, newest first. */
export function getWeekActivities(offsetWeeks = 0): WeekActivities {
  const { from, to } = getWeekBounds(offsetWeeks);
  const allTypes = [...GOAL_ACTIVITY_TYPES.strength, ...GOAL_ACTIVITY_TYPES.cardio, ...GOAL_ACTIVITY_TYPES.golf];

  // Per-workout summary: exercise names in order + total set count
  const workoutSummary = (idExpr: string) => `
    (SELECT GROUP_CONCAT(name, ', ') FROM (
       SELECT e.name FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = ${idExpr} ORDER BY we.sort_order)) AS exercise_names,
    (SELECT COUNT(*) FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
       WHERE we.workout_id = ${idExpr}) AS set_count`;

  const runs = db.prepare(`
    SELECT 'activity' AS kind, r.id, r.type, r.title, r.logged_at, r.duration_seconds, r.distance_miles,
           r.notes, r.source, r.workout_id, w.title AS workout_title,
           ${workoutSummary('r.workout_id')}
    FROM runs r
    LEFT JOIN workouts w ON w.id = r.workout_id
    WHERE r.logged_at >= $from AND r.logged_at <= $to AND r.type IN ${sqlList(allTypes)}
    ORDER BY r.logged_at DESC
  `).all({ from, to } as P) as unknown as GoalActivity[];

  // Manually logged workouts not attached to a synced activity
  const workouts = db.prepare(`
    SELECT 'workout' AS kind, w.id, 'strength' AS type, w.title, w.logged_at,
           NULL AS duration_seconds, NULL AS distance_miles, w.notes, 'manual' AS source,
           w.id AS workout_id, w.title AS workout_title,
           ${workoutSummary('w.id')}
    FROM workouts w
    WHERE w.logged_at >= $from AND w.logged_at <= $to
      AND w.id NOT IN (SELECT workout_id FROM runs WHERE workout_id IS NOT NULL)
  `).all({ from, to } as P) as unknown as GoalActivity[];

  const inList = (list: readonly string[]) => (a: GoalActivity) => list.includes(a.type);
  return {
    strength: [...runs.filter(inList(GOAL_ACTIVITY_TYPES.strength)), ...workouts]
      .sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
    cardio: runs.filter(inList(GOAL_ACTIVITY_TYPES.cardio)),
    golf: runs.filter(inList(GOAL_ACTIVITY_TYPES.golf)),
  };
}
