/**
 * One-shot script: imports exercises from the Wger public API into the local SQLite DB.
 * Run with: npx tsx server/src/scripts/importWger.ts
 *
 * Safe to re-run — exercises are inserted with INSERT OR IGNORE so duplicates are skipped.
 */

import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const DB_PATH = resolve(__dirname, '../../..', process.env.DB_PATH ?? 'fitness.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

// ── Wger muscle ID → our muscle_group name(s) ─────────────────────────────
// Wger muscles are coarser than ours, so we map to the most representative sub-muscle.
const MUSCLE_MAP: Record<number, string[]> = {
  1:  ['Biceps Long Head'],               // Biceps brachii
  2:  ['Front Delt'],                     // Anterior deltoid
  3:  ['Mid Traps / Rhomboids'],          // Trapezius
  4:  ['Mid/Sternal Pec'],               // Pectoralis major
  6:  ['Rectus Abdominis'],              // Rectus abdominis
  7:  ['Calves'],                        // Gastrocnemius
  8:  ['Glutes - Gluteus Maximus'],      // Gluteus maximus
  9:  ['Triceps Long Head'],             // Triceps brachii
  10: ['Quads - Rectus Femoris'],        // Quadriceps femoris
  11: ['Hamstrings - Biceps Femoris'],   // Biceps femoris
  12: ['Lats'],                          // Latissimus dorsi
  13: ['Brachialis'],                    // Brachialis
  14: ['Obliques'],                      // Obliquus externus abdominis
  15: ['Rectus Abdominis'],             // Serratus anterior (closest available)
};

// ── Wger equipment name → our equipment string ────────────────────────────
const EQUIPMENT_MAP: Record<string, string> = {
  'Barbell':                   'Barbell',
  'SZ-Bar':                    'Barbell',
  'Dumbbell':                  'Dumbbell',
  'Kettlebell':                'Dumbbell',
  'Pull-up bar':               'Bodyweight',
  'none (bodyweight exercise)':'Bodyweight',
  'Gym mat':                   'Bodyweight',
  'Bench':                     'Bodyweight',
  'Incline bench':             'Bodyweight',
  'Swiss Ball':                'Bodyweight',
  'Resistance band':           'Cable',
};

// ── Wger category ID → our movement_pattern ──────────────────────────────
const CATEGORY_PATTERN_MAP: Record<number, string> = {
  10: 'Isolation', // Abs
  8:  'Isolation', // Arms
  12: 'Pull',      // Back
  14: 'Isolation', // Calves
  11: 'Push',      // Chest
  9:  'Squat',     // Legs
  13: 'Push',      // Shoulders
  // 15 = Cardio — excluded
};

const WGER_BASE = 'https://wger.de/api/v2';
const PAGE_SIZE = 100;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

interface WgerMuscle { id: number }
interface WgerEquipment { id: number; name: string }
interface WgerCategory { id: number; name: string }
interface WgerTranslation { name: string; description: string; language: number }
interface WgerExerciseInfo {
  id: number;
  category: WgerCategory;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  translations: WgerTranslation[];
}

async function fetchAllExercises(): Promise<WgerExerciseInfo[]> {
  const all: WgerExerciseInfo[] = [];
  let url: string | null = `${WGER_BASE}/exerciseinfo/?format=json&language=2&limit=${PAGE_SIZE}`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wger API error: ${res.status}`);
    const data = await res.json() as { results: WgerExerciseInfo[]; next: string | null };
    all.push(...data.results);
    url = data.next;
    process.stdout.write(`  fetched ${all.length} exercises...\r`);
  }
  console.log(`\n  total from API: ${all.length}`);
  return all;
}

function resolveMuscleName(name: string): number | undefined {
  const row = db.prepare('SELECT id FROM muscle_groups WHERE name = ?').get(name) as { id: number } | undefined;
  return row?.id;
}

function main() {
  // Pre-load all muscle group ids we'll need
  const muscleIdCache: Record<string, number | undefined> = {};
  const getMusclId = (name: string) => {
    if (!(name in muscleIdCache)) muscleIdCache[name] = resolveMuscleName(name);
    return muscleIdCache[name];
  };

  const insertExercise = db.prepare(`
    INSERT OR IGNORE INTO exercises (name, description, equipment, movement_pattern)
    VALUES (:name, :description, :equipment, :movement_pattern)
  `);

  const insertMuscle = db.prepare(`
    INSERT OR IGNORE INTO exercise_muscle_groups (exercise_id, muscle_group_id, role)
    VALUES (:exercise_id, :muscle_group_id, :role)
  `);

  const getExerciseId = db.prepare('SELECT id FROM exercises WHERE name = ?');

  return async () => {
    console.log('Fetching exercises from Wger...');
    const exercises = await fetchAllExercises();

    let inserted = 0;
    let skipped = 0;

    for (const ex of exercises) {
      // Skip cardio
      if (ex.category.id === 15) { skipped++; continue; }

      // Must have a known movement pattern
      const movement_pattern = CATEGORY_PATTERN_MAP[ex.category.id];
      if (!movement_pattern) { skipped++; continue; }

      // Get English translation (language=2)
      const trans = ex.translations.find(t => t.language === 2);
      if (!trans?.name?.trim()) { skipped++; continue; }

      const name = trans.name.trim();
      const description = stripHtml(trans.description ?? '');

      // Pick equipment: first mappable one, else Bodyweight
      let equipment = 'Bodyweight';
      for (const eq of ex.equipment) {
        const mapped = EQUIPMENT_MAP[eq.name];
        if (mapped) { equipment = mapped; break; }
      }

      // Build muscle assignments
      const primaryMuscles: number[] = [];
      const secondaryMuscles: number[] = [];

      for (const m of ex.muscles) {
        const names = MUSCLE_MAP[m.id];
        if (!names) continue;
        for (const n of names) {
          const id = getMusclId(n);
          if (id) primaryMuscles.push(id);
        }
      }
      for (const m of ex.muscles_secondary) {
        const names = MUSCLE_MAP[m.id];
        if (!names) continue;
        for (const n of names) {
          const id = getMusclId(n);
          if (id) secondaryMuscles.push(id);
        }
      }

      // Skip exercises with no mappable muscles at all
      if (primaryMuscles.length === 0 && secondaryMuscles.length === 0) {
        skipped++;
        continue;
      }

      insertExercise.run({ name, description, equipment, movement_pattern } as Record<string, string | number | null | bigint>);

      const row = getExerciseId.get(name) as { id: number } | undefined;
      if (!row) { skipped++; continue; }

      const exerciseId = row.id;
      for (const mgId of primaryMuscles) {
        insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: mgId, role: 'primary' } as Record<string, string | number | null | bigint>);
      }
      for (const mgId of secondaryMuscles) {
        if (!primaryMuscles.includes(mgId)) {
          insertMuscle.run({ exercise_id: exerciseId, muscle_group_id: mgId, role: 'secondary' } as Record<string, string | number | null | bigint>);
        }
      }

      inserted++;
    }

    console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
    db.close();
  };
}

main()().catch(err => { console.error(err); process.exit(1); });
