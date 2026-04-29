import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

import db from '../db';
import { muscleGroupSeed } from './muscleGroups';
import { exerciseSeed } from './exercises';

function run() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM muscle_groups').get() as {
    count: number;
  };
  if (existing.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  db.exec('BEGIN TRANSACTION');
  try {
    const insertParent = db.prepare('INSERT INTO muscle_groups (name) VALUES ($name)');
    const insertChild = db.prepare(
      'INSERT INTO muscle_groups (name, parent_id) VALUES ($name, $parent_id)',
    );
    const getByName = db.prepare('SELECT id FROM muscle_groups WHERE name = $name');

    for (const group of muscleGroupSeed) {
      insertParent.run({ name: group.name });
      const parent = getByName.get({ name: group.name }) as { id: number };
      for (const child of group.children) {
        insertChild.run({ name: child, parent_id: parent.id });
      }
    }

    const insertExercise = db.prepare(
      `INSERT INTO exercises (name, description, equipment, movement_pattern)
       VALUES ($name, $description, $equipment, $movement_pattern)`,
    );
    const insertMuscle = db.prepare(
      `INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, role)
       VALUES ($exercise_id, $muscle_group_id, $role)`,
    );

    for (const ex of exerciseSeed) {
      const result = insertExercise.run({
        name: ex.name,
        description: ex.description,
        equipment: ex.equipment,
        movement_pattern: ex.movement_pattern,
      }) as { lastInsertRowid: number };

      const exerciseId = result.lastInsertRowid;

      for (const muscle of ex.muscles) {
        const mg = getByName.get({ name: muscle.name }) as { id: number } | undefined;
        if (!mg) {
          console.warn(`  ⚠ Muscle group not found: "${muscle.name}" for exercise "${ex.name}"`);
          continue;
        }
        insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: mg.id, role: muscle.role });
      }
    }

    db.exec('COMMIT');

    const mgCount = (db.prepare('SELECT COUNT(*) as c FROM muscle_groups').get() as { c: number }).c;
    const exCount = (db.prepare('SELECT COUNT(*) as c FROM exercises').get() as { c: number }).c;
    console.log(`Seeded ${mgCount} muscle groups and ${exCount} exercises.`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

run();
