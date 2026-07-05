/**
 * One-shot script: imports 1,324 exercises from hasaneyldrm/exercises-dataset.
 * Run with: npm run import-dataset
 *
 * Deduplication strategy (dataset takes priority):
 *   - Existing exercise matched by name → description, equipment, movement_pattern
 *     and muscle groups are REPLACED with the dataset's version.
 *   - New exercises → inserted fresh.
 *   - Cardio exercises and those with no mappable muscles → skipped.
 */

import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const DB_PATH = resolve(__dirname, '../../..', process.env.DB_PATH ?? 'fitness.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

type P = Record<string, string | number | null | bigint>;

// ── Equipment → our 5 canonical values ───────────────────────────────────────
const EQUIPMENT_MAP: Record<string, string> = {
  'barbell':              'Barbell',
  'ez barbell':           'Barbell',
  'olympic barbell':      'Barbell',
  'smith machine':        'Barbell',  // guided barbell movement
  'trap bar':             'Barbell',
  'dumbbell':             'Dumbbell',
  'kettlebell':           'Dumbbell',
  'hammer':               'Dumbbell', // weighted implement
  'weighted':             'Dumbbell', // weighted vest/plate
  'cable':                'Cable',
  'band':                 'Cable',    // constant tension like cable
  'resistance band':      'Cable',
  'rope':                 'Cable',    // typically cable rope attachment
  'leverage machine':     'Machine',
  'assisted':             'Machine',  // assisted pull-up/dip machine
  'sled machine':         'Machine',
  'body weight':          'Bodyweight',
  'bosu ball':            'Bodyweight',
  'medicine ball':        'Bodyweight',
  'roller':               'Bodyweight',
  'stability ball':       'Bodyweight',
  'tire':                 'Bodyweight',
  'wheel roller':         'Bodyweight',
  // Cardio-only equipment — exercises using these are skipped via category
  'elliptical machine':   'Bodyweight', // fallback; filtered by category
  'skierg machine':       'Bodyweight',
  'sled machine_cardio':  'Machine',
  'stationary bike':      'Bodyweight',
  'stepmill machine':     'Bodyweight',
  'upper body ergometer': 'Bodyweight',
};

// ── Category → movement_pattern ──────────────────────────────────────────────
const CATEGORY_PATTERN_MAP: Record<string, string> = {
  'back':       'Pull',
  'chest':      'Push',
  'shoulders':  'Push',
  'upper arms': 'Isolation',
  'lower arms': 'Isolation',
  'upper legs': 'Squat',
  'lower legs': 'Isolation',
  'waist':      'Isolation',
  'neck':       'Isolation',
  // 'cardio' → excluded below
};

const SKIP_CATEGORIES = new Set(['cardio']);
const SKIP_TARGETS    = new Set(['cardiovascular system']);

// ── Target (primary) → our muscle_group name ─────────────────────────────────
const TARGET_MAP: Record<string, string> = {
  'abs':               'Rectus Abdominis',
  'abductors':         'Glutes - Gluteus Medius',
  'adductors':         'Quads - VMO',          // inner thigh, closest sub-muscle
  'biceps':            'Biceps Long Head',
  'calves':            'Calves',
  'delts':             'Front Delt',
  'forearms':          'Forearms',
  'glutes':            'Glutes - Gluteus Maximus',
  'hamstrings':        'Hamstrings - Biceps Femoris',
  'lats':              'Lats',
  'levator scapulae':  'Mid Traps / Rhomboids',
  'pectorals':         'Mid/Sternal Pec',
  'quads':             'Quads - Rectus Femoris',
  'serratus anterior': 'Lats',                 // closest available
  'spine':             'Lower Traps',          // erector spinae → lower traps
  'traps':             'Mid Traps / Rhomboids',
  'triceps':           'Triceps Long Head',
  'upper back':        'Mid Traps / Rhomboids',
};

// ── Secondary muscles → our muscle_group name ────────────────────────────────
// null = no meaningful mapping, skip that secondary entry
const SECONDARY_MAP: Record<string, string | null> = {
  'abdominals':           'Rectus Abdominis',
  'ankle stabilizers':    null,
  'ankles':               null,
  'back':                 'Lats',
  'biceps':               'Biceps Long Head',
  'brachialis':           'Brachialis',
  'calves':               'Calves',
  'chest':                'Mid/Sternal Pec',
  'core':                 'Transverse Abdominis',
  'deltoids':             'Front Delt',
  'feet':                 null,
  'forearms':             'Forearms',
  'glutes':               'Glutes - Gluteus Maximus',
  'grip muscles':         'Forearms',
  'groin':                null,
  'hamstrings':           'Hamstrings - Biceps Femoris',
  'hands':                null,
  'hip flexors':          'Quads - Rectus Femoris',
  'inner thighs':         'Quads - VMO',
  'latissimus dorsi':     'Lats',
  'lats':                 'Lats',
  'lower abs':            'Rectus Abdominis',
  'lower back':           'Lower Traps',
  'obliques':             'Obliques',
  'quadriceps':           'Quads - Rectus Femoris',
  'rear deltoids':        'Rear Delt',
  'rhomboids':            'Mid Traps / Rhomboids',
  'rotator cuff':         'Rear Delt',
  'shins':                null,
  'shoulders':            'Front Delt',
  'soleus':               'Calves',
  'sternocleidomastoid':  null,
  'trapezius':            'Mid Traps / Rhomboids',
  'traps':                'Mid Traps / Rhomboids',
  'triceps':              'Triceps Long Head',
  'upper back':           'Mid Traps / Rhomboids',
  'upper chest':          'Upper Pec',
  'wrist extensors':      'Forearms',
  'wrist flexors':        'Forearms',
  'wrists':               'Forearms',
};

interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  secondary_muscles: string[];
  instructions: { en?: string; [lang: string]: string | undefined };
}

async function fetchDataset(): Promise<DatasetExercise[]> {
  const url = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
  console.log('Fetching exercises-dataset from GitHub...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching dataset`);
  return res.json() as Promise<DatasetExercise[]>;
}

function getMuscleGroupId(name: string, cache: Map<string, number | undefined>): number | undefined {
  if (!cache.has(name)) {
    const row = db.prepare('SELECT id FROM muscle_groups WHERE name = ?').get(name) as { id: number } | undefined;
    cache.set(name, row?.id);
  }
  return cache.get(name);
}

async function main() {
  const exercises = await fetchDataset();
  console.log(`  ${exercises.length} exercises loaded`);

  const muscleCache = new Map<string, number | undefined>();

  const getExerciseByName = db.prepare('SELECT id FROM exercises WHERE LOWER(name) = LOWER(?)');

  const insertExercise = db.prepare(`
    INSERT INTO exercises (name, description, equipment, movement_pattern)
    VALUES (:name, :description, :equipment, :movement_pattern)
  `);

  const updateExercise = db.prepare(`
    UPDATE exercises
    SET description = :description, equipment = :equipment, movement_pattern = :movement_pattern
    WHERE id = :id
  `);

  const deleteMuscles = db.prepare(
    'DELETE FROM exercise_muscle_groups WHERE exercise_id = ?'
  );

  const insertMuscle = db.prepare(`
    INSERT OR IGNORE INTO exercise_muscle_groups (exercise_id, muscle_group_id, role)
    VALUES (:exercise_id, :muscle_group_id, :role)
  `);

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const ex of exercises) {
    const cat = ex.category?.toLowerCase().trim();

    // Skip cardio
    if (SKIP_CATEGORIES.has(cat)) { skipped++; continue; }
    if (SKIP_TARGETS.has(ex.target?.toLowerCase().trim())) { skipped++; continue; }

    const movement_pattern = CATEGORY_PATTERN_MAP[cat];
    if (!movement_pattern) { skipped++; continue; }

    const name = ex.name?.trim();
    if (!name) { skipped++; continue; }

    // Description: English instructions only
    const description = (ex.instructions?.en ?? '').trim() || null;

    // Equipment: map to our canonical value, default to Bodyweight
    const equipment = EQUIPMENT_MAP[ex.equipment?.toLowerCase().trim()] ?? 'Bodyweight';

    // Primary muscle
    const primaryMuscleName = TARGET_MAP[ex.target?.toLowerCase().trim()];
    const primaryMuscleId   = primaryMuscleName
      ? getMuscleGroupId(primaryMuscleName, muscleCache)
      : undefined;

    // Secondary muscles
    const secondaryMuscleIds: number[] = [];
    for (const sm of (ex.secondary_muscles ?? [])) {
      const mapped = SECONDARY_MAP[sm.toLowerCase().trim()];
      if (!mapped) continue;
      const id = getMuscleGroupId(mapped, muscleCache);
      if (id && id !== primaryMuscleId) secondaryMuscleIds.push(id);
    }

    // Require at least a primary muscle mapping
    if (!primaryMuscleId) { skipped++; continue; }

    // Deduplicate secondary list
    const uniqueSecondaries = [...new Set(secondaryMuscleIds)];

    // Upsert: dataset takes priority — update existing, insert new
    const existingRow = getExerciseByName.get(name) as { id: number } | undefined;

    let exerciseId: number;
    if (existingRow) {
      exerciseId = existingRow.id;
      updateExercise.run({ id: exerciseId, description, equipment, movement_pattern } as P);
      deleteMuscles.run(exerciseId);
      updated++;
    } else {
      const result = insertExercise.run({ name, description, equipment, movement_pattern } as P) as { lastInsertRowid: number };
      exerciseId = result.lastInsertRowid;
      inserted++;
    }

    // Write muscle groups
    insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: primaryMuscleId, role: 'primary' } as P);
    for (const mgId of uniqueSecondaries) {
      insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: mgId, role: 'secondary' } as P);
    }
  }

  const total = (db.prepare('SELECT COUNT(*) as n FROM exercises').get() as unknown as { n: number }).n;
  console.log(`\nDone.`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Updated  : ${updated}  (existing exercises overwritten with dataset data)`);
  console.log(`  Skipped  : ${skipped}  (cardio / unmappable / no name)`);
  console.log(`  Total in DB: ${total}`);
  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
