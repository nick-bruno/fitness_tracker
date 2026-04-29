import db from '../db';
import type {
  WorkoutCreateInput,
  WorkoutDetail,
  WorkoutExerciseDetail,
  WorkoutSummary,
  SetEntry,
} from '../types';

type P = Record<string, string | number | null | bigint>;

export function listWorkouts(opts: {
  limit: number;
  offset: number;
  from?: string;
  to?: string;
}): { workouts: WorkoutSummary[]; total: number } {
  const conditions: string[] = [];
  const filterParams: P = {};

  if (opts.from) {
    conditions.push('w.logged_at >= $from');
    filterParams['from'] = opts.from;
  }
  if (opts.to) {
    conditions.push('w.logged_at <= $to');
    filterParams['to'] = opts.to;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageParams: P = { ...filterParams, limit: opts.limit, offset: opts.offset };

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM workouts w ${where}`).get(filterParams) as unknown as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT w.id, w.title, w.logged_at, w.notes,
         COUNT(DISTINCT we.id) AS exercise_count,
         COUNT(s.id)           AS total_sets,
         GROUP_CONCAT(e.name, '||') AS exercise_names_raw
       FROM workouts w
       LEFT JOIN workout_exercises we ON we.workout_id = w.id
       LEFT JOIN exercises e ON e.id = we.exercise_id
       LEFT JOIN sets s ON s.workout_exercise_id = we.id
       ${where}
       GROUP BY w.id
       ORDER BY w.logged_at DESC
       LIMIT $limit OFFSET $offset`,
    )
    .all(pageParams) as unknown as {
    id: number;
    title: string | null;
    logged_at: string;
    notes: string | null;
    exercise_count: number;
    total_sets: number;
    exercise_names_raw: string | null;
  }[];

  const workouts: WorkoutSummary[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    logged_at: r.logged_at,
    notes: r.notes,
    exercise_count: r.exercise_count,
    total_sets: r.total_sets,
    exercise_names: r.exercise_names_raw ? [...new Set(r.exercise_names_raw.split('||'))] : [],
  }));

  return { workouts, total };
}

export function getWorkoutById(id: number): WorkoutDetail | undefined {
  const workout = db
    .prepare('SELECT id, title, logged_at, notes FROM workouts WHERE id = $id')
    .get({ id }) as unknown as { id: number; title: string | null; logged_at: string; notes: string | null } | undefined;
  if (!workout) return undefined;

  const weRows = db
    .prepare(
      `SELECT we.id AS workout_exercise_id, we.exercise_id, e.name AS exercise_name, we.sort_order
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = $workout_id
       ORDER BY we.sort_order`,
    )
    .all({ workout_id: id }) as unknown as {
    workout_exercise_id: number;
    exercise_id: number;
    exercise_name: string;
    sort_order: number;
  }[];

  const exercises: WorkoutExerciseDetail[] = [];
  for (const we of weRows) {
    const muscles = db
      .prepare(
        `SELECT mg.name AS muscle_group_name, emg.role
         FROM exercise_muscle_groups emg
         JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
         WHERE emg.exercise_id = $exercise_id`,
      )
      .all({ exercise_id: we.exercise_id }) as unknown as { muscle_group_name: string; role: string }[];

    const sets = db
      .prepare(
        `SELECT id, set_number, reps, weight_lb, rpe, notes
         FROM sets WHERE workout_exercise_id = $wei ORDER BY set_number`,
      )
      .all({ wei: we.workout_exercise_id }) as unknown as SetEntry[];

    exercises.push({ ...we, muscles, sets });
  }

  return { id: workout.id, title: workout.title, logged_at: workout.logged_at, notes: workout.notes, exercises };
}

export function createWorkout(data: WorkoutCreateInput): WorkoutDetail {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = db
      .prepare('INSERT INTO workouts (title, logged_at, notes) VALUES ($title, $logged_at, $notes)')
      .run({
        title: data.title ?? null,
        logged_at: data.logged_at ?? new Date().toISOString(),
        notes: data.notes ?? null,
      }) as { lastInsertRowid: number };

    const workoutId = result.lastInsertRowid;
    insertExercisesAndSets(workoutId, data.exercises);

    db.exec('COMMIT');
    return getWorkoutById(workoutId)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function updateWorkout(
  id: number,
  data: WorkoutCreateInput,
): WorkoutDetail | undefined {
  if (!getWorkoutById(id)) return undefined;

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('UPDATE workouts SET title = $title, logged_at = $logged_at, notes = $notes WHERE id = $id').run({
      id,
      title: data.title ?? null,
      logged_at: data.logged_at ?? new Date().toISOString(),
      notes: data.notes ?? null,
    });

    db.prepare('DELETE FROM workout_exercises WHERE workout_id = $id').run({ id });
    insertExercisesAndSets(id, data.exercises);

    db.exec('COMMIT');
    return getWorkoutById(id);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function deleteWorkout(id: number): boolean {
  const result = db.prepare('DELETE FROM workouts WHERE id = $id').run({ id }) as {
    changes: number;
  };
  return result.changes > 0;
}

function insertExercisesAndSets(
  workoutId: number,
  exercises: WorkoutCreateInput['exercises'],
) {
  const insertWE = db.prepare(
    'INSERT INTO workout_exercises (workout_id, exercise_id, sort_order) VALUES ($workout_id, $exercise_id, $sort_order)',
  );
  const insertSet = db.prepare(
    `INSERT INTO sets (workout_exercise_id, set_number, reps, weight_lb, rpe, notes)
     VALUES ($workout_exercise_id, $set_number, $reps, $weight_lb, $rpe, $notes)`,
  );

  for (const ex of exercises) {
    const weResult = insertWE.run({
      workout_id: workoutId,
      exercise_id: ex.exercise_id,
      sort_order: ex.sort_order,
    }) as { lastInsertRowid: number };

    const weId = weResult.lastInsertRowid;
    for (const s of ex.sets) {
      insertSet.run({
        workout_exercise_id: weId,
        set_number: s.set_number,
        reps: s.reps ?? null,
        weight_lb: s.weight_lb ?? null,
        rpe: s.rpe ?? null,
        notes: s.notes ?? null,
      });
    }
  }
}

export interface MuscleVolumeSummary {
  muscle_group_name: string;
  parent_name: string | null;
  total_sets: number;
  last_trained_date: string | null;
}

export function getMuscleVolumeSummary(lookbackDays: number): MuscleVolumeSummary[] {
  const rows = db
    .prepare(
      `SELECT
         mg.name AS muscle_group_name,
         pmg.name AS parent_name,
         COUNT(s.id) AS total_sets,
         MAX(w.logged_at) AS last_trained_date
       FROM muscle_groups mg
       LEFT JOIN muscle_groups pmg ON pmg.id = mg.parent_id
       LEFT JOIN exercise_muscle_groups emg ON emg.muscle_group_id = mg.id
       LEFT JOIN exercises e ON e.id = emg.exercise_id
       LEFT JOIN workout_exercises we ON we.exercise_id = e.id
       LEFT JOIN workouts w ON w.id = we.workout_id
         AND w.logged_at >= datetime('now', $days)
       LEFT JOIN sets s ON s.workout_exercise_id = we.id
       WHERE mg.parent_id IS NOT NULL
       GROUP BY mg.id
       ORDER BY mg.name`,
    )
    .all({ days: `-${lookbackDays} days` }) as unknown as MuscleVolumeSummary[];
  return rows;
}

export function getRecentWorkoutsForAI(lookbackDays: number, limit = 10) {
  const workoutIds = db
    .prepare(
      `SELECT id FROM workouts
       WHERE logged_at >= datetime('now', $days)
       ORDER BY logged_at DESC LIMIT $limit`,
    )
    .all({ days: `-${lookbackDays} days`, limit }) as unknown as { id: number }[];

  return workoutIds.map((w) => getWorkoutById(w.id)).filter(Boolean) as WorkoutDetail[];
}
