import db from '../db';
import type {
  Exercise,
  ExerciseMuscle,
  ExerciseWithMuscles,
  MuscleGroup,
  MuscleGroupWithChildren,
} from '../types';

type P = Record<string, string | number | null | bigint>;

function toExerciseWithMuscles(rows: Record<string, unknown>[]): ExerciseWithMuscles | undefined {
  if (rows.length === 0) return undefined;
  const first = rows[0];
  const exercise: ExerciseWithMuscles = {
    id: first.id as number,
    name: first.name as string,
    description: first.description as string | null,
    equipment: first.equipment as string,
    movement_pattern: first.movement_pattern as string,
    created_at: first.created_at as string,
    muscles: [],
  };
  for (const row of rows) {
    if (row.muscle_group_id != null) {
      exercise.muscles.push({
        muscle_group_id: row.muscle_group_id as number,
        muscle_group_name: row.muscle_group_name as string,
        parent_id: row.parent_id as number | null,
        parent_name: row.parent_name as string | null,
        role: row.role as 'primary' | 'secondary',
      });
    }
  }
  return exercise;
}

const exerciseWithMusclesQuery = `
  SELECT
    e.id, e.name, e.description, e.equipment, e.movement_pattern, e.created_at,
    emg.muscle_group_id,
    mg.name  AS muscle_group_name,
    mg.parent_id,
    pmg.name AS parent_name,
    emg.role
  FROM exercises e
  LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
  LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
  LEFT JOIN muscle_groups pmg ON pmg.id = mg.parent_id
`;

export function listExercises(opts: {
  search?: string;
  muscleGroupId?: number;
  equipment?: string;
  role?: 'primary' | 'secondary';
}): ExerciseWithMuscles[] {
  const conditions: string[] = [];
  const params: P = {};

  if (opts.search) {
    conditions.push('LOWER(e.name) LIKE $search');
    params['search'] = `%${opts.search.toLowerCase()}%`;
  }
  if (opts.equipment) {
    conditions.push('e.equipment = $equipment');
    params['equipment'] = opts.equipment;
  }
  if (opts.muscleGroupId != null && opts.role) {
    conditions.push(
      'e.id IN (SELECT exercise_id FROM exercise_muscle_groups WHERE muscle_group_id = $mgId AND role = $role)',
    );
    params['mgId'] = opts.muscleGroupId;
    params['role'] = opts.role;
  } else if (opts.muscleGroupId != null) {
    conditions.push(
      'e.id IN (SELECT exercise_id FROM exercise_muscle_groups WHERE muscle_group_id = $mgId)',
    );
    params['mgId'] = opts.muscleGroupId;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${exerciseWithMusclesQuery} ${where} ORDER BY e.name`;
  const rows = db.prepare(sql).all(params) as unknown as Record<string, unknown>[];

  const byId = new Map<number, Record<string, unknown>[]>();
  for (const row of rows) {
    const id = row.id as number;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id)!.push(row);
  }

  const result: ExerciseWithMuscles[] = [];
  for (const [, group] of byId) {
    const ex = toExerciseWithMuscles(group);
    if (ex) result.push(ex);
  }
  return result;
}

export function getExerciseById(id: number): ExerciseWithMuscles | undefined {
  const rows = db
    .prepare(`${exerciseWithMusclesQuery} WHERE e.id = $id`)
    .all({ id }) as unknown as Record<string, unknown>[];
  return toExerciseWithMuscles(rows);
}

export function createExercise(data: {
  name: string;
  description?: string;
  equipment: string;
  movement_pattern: string;
  muscles: { muscle_group_id: number; role: 'primary' | 'secondary' }[];
}): ExerciseWithMuscles {
  db.exec('BEGIN TRANSACTION');
  try {
    const result = db
      .prepare(
        `INSERT INTO exercises (name, description, equipment, movement_pattern)
         VALUES ($name, $description, $equipment, $movement_pattern)`,
      )
      .run({
        name: data.name,
        description: data.description ?? null,
        equipment: data.equipment,
        movement_pattern: data.movement_pattern,
      }) as { lastInsertRowid: number };

    const exerciseId = result.lastInsertRowid;
    const insertMuscle = db.prepare(
      'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, role) VALUES ($exercise_id, $muscle_group_id, $role)',
    );
    for (const m of data.muscles) {
      insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: m.muscle_group_id, role: m.role });
    }

    db.exec('COMMIT');
    return getExerciseById(exerciseId)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function updateExercise(
  id: number,
  data: {
    name?: string;
    description?: string;
    equipment?: string;
    movement_pattern?: string;
    muscles?: { muscle_group_id: number; role: 'primary' | 'secondary' }[];
  },
): ExerciseWithMuscles | undefined {
  const existing = getExerciseById(id);
  if (!existing) return undefined;

  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(
      `UPDATE exercises SET
        name             = $name,
        description      = $description,
        equipment        = $equipment,
        movement_pattern = $movement_pattern
       WHERE id = $id`,
    ).run({
      id,
      name: data.name ?? existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      equipment: data.equipment ?? existing.equipment,
      movement_pattern: data.movement_pattern ?? existing.movement_pattern,
    });

    if (data.muscles !== undefined) {
      db.prepare('DELETE FROM exercise_muscle_groups WHERE exercise_id = $id').run({ id });
      const insertMuscle = db.prepare(
        'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, role) VALUES ($exercise_id, $muscle_group_id, $role)',
      );
      for (const m of data.muscles) {
        insertMuscle.run({ exercise_id: id, muscle_group_id: m.muscle_group_id, role: m.role });
      }
    }

    db.exec('COMMIT');
    return getExerciseById(id);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function deleteExercise(id: number): boolean {
  const result = db.prepare('DELETE FROM exercises WHERE id = $id').run({ id }) as {
    changes: number;
  };
  return result.changes > 0;
}

export function getMuscleGroups(): MuscleGroupWithChildren[] {
  const rows = db
    .prepare('SELECT id, name, parent_id FROM muscle_groups ORDER BY parent_id NULLS FIRST, name')
    .all() as unknown as MuscleGroup[];

  const map = new Map<number, MuscleGroupWithChildren>();
  const roots: MuscleGroupWithChildren[] = [];

  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }
  for (const [, node] of map) {
    if (node.parent_id == null) {
      roots.push(node);
    } else {
      map.get(node.parent_id)?.children.push(node);
    }
  }
  return roots;
}

export function getExerciseLibraryForAI(): { id: number; name: string; primary_muscle: string }[] {
  const rows = db
    .prepare(
      `SELECT e.id, e.name, mg.name AS primary_muscle
       FROM exercises e
       JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id AND emg.role = 'primary'
       JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
       ORDER BY e.name`,
    )
    .all() as { id: number; name: string; primary_muscle: string }[];
  return rows;
}
