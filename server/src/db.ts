import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });

// Always resolve relative to the server root so cwd doesn't affect the path
const DB_PATH = resolve(__dirname, '../..', process.env.DB_PATH ?? 'fitness.db');

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS muscle_groups (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES muscle_groups(id)
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL UNIQUE,
    description      TEXT,
    equipment        TEXT NOT NULL,
    movement_pattern TEXT NOT NULL,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id     INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_group_id INTEGER NOT NULL REFERENCES muscle_groups(id),
    role            TEXT NOT NULL CHECK(role IN ('primary', 'secondary')),
    UNIQUE(exercise_id, muscle_group_id)
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT,
    logged_at TEXT NOT NULL DEFAULT (datetime('now')),
    notes     TEXT
  );

  CREATE TABLE IF NOT EXISTS workout_exercises (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sets (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number          INTEGER NOT NULL,
    reps                INTEGER,
    weight_lb           REAL,
    rpe                 REAL,
    notes               TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT,
    logged_at        TEXT NOT NULL DEFAULT (datetime('now')),
    distance_miles   REAL NOT NULL,
    duration_seconds INTEGER NOT NULL,
    notes            TEXT
  );
`);

// Add type column to runs for activity discrimination (run vs row)
const runCols = db.prepare("PRAGMA table_info(runs)").all() as unknown as { name: string }[];
if (!runCols.some((c) => c.name === 'type')) {
  db.exec("ALTER TABLE runs ADD COLUMN type TEXT NOT NULL DEFAULT 'run'");
}
if (!runCols.some((c) => c.name === 'source')) {
  db.exec("ALTER TABLE runs ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'");
}
if (!runCols.some((c) => c.name === 'external_id')) {
  db.exec('ALTER TABLE runs ADD COLUMN external_id TEXT');
}
// Partial unique index — allows multiple NULLs, enforces uniqueness only where external_id is set
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_external_id
  ON runs (external_id) WHERE external_id IS NOT NULL
`);

// Migration: make distance_miles nullable (needed for misc activities like tennis/golf/pickleball)
const runColInfo = db.prepare("PRAGMA table_info(runs)").all() as unknown as { name: string; notnull: number }[];
const distCol = runColInfo.find(c => c.name === 'distance_miles');
if (distCol && distCol.notnull === 1) {
  db.exec(`
    CREATE TABLE runs_nullable_dist (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      type             TEXT NOT NULL DEFAULT 'run',
      title            TEXT,
      logged_at        TEXT NOT NULL DEFAULT (datetime('now')),
      distance_miles   REAL,
      duration_seconds INTEGER NOT NULL,
      notes            TEXT,
      source           TEXT NOT NULL DEFAULT 'manual',
      external_id      TEXT
    );
    INSERT INTO runs_nullable_dist (id, type, title, logged_at, distance_miles, duration_seconds, notes, source, external_id)
      SELECT id, type, title, logged_at, distance_miles, duration_seconds, notes, source, external_id FROM runs;
    DROP TABLE runs;
    ALTER TABLE runs_nullable_dist RENAME TO runs;
    CREATE UNIQUE INDEX idx_runs_external_id_new ON runs (external_id) WHERE external_id IS NOT NULL;
  `);
}

// Add title column to workouts if it doesn't exist yet (one-time migration)
const workoutCols = db.prepare("PRAGMA table_info(workouts)").all() as unknown as { name: string }[];
if (!workoutCols.some((c) => c.name === 'title')) {
  db.exec('ALTER TABLE workouts ADD COLUMN title TEXT');
}

// Rename weight_kg → weight_lb if the old column still exists (one-time migration)
const cols = db.prepare("PRAGMA table_info(sets)").all() as unknown as { name: string }[];
if (cols.some((c) => c.name === 'weight_kg')) {
  db.exec('ALTER TABLE sets RENAME COLUMN weight_kg TO weight_lb');
}

// Add location column to workouts (one-time migration)
if (!workoutCols.some((c) => c.name === 'location')) {
  db.exec('ALTER TABLE workouts ADD COLUMN location TEXT');
}

// Goals table — single row (id=1) storing the user's default targets
db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id             INTEGER PRIMARY KEY,
    strength_goal  INTEGER NOT NULL DEFAULT 4,
    cardio_goal    INTEGER NOT NULL DEFAULT 3
  )
`);
const hasGoalRow = db.prepare('SELECT id FROM goals WHERE id = 1').get();
if (!hasGoalRow) {
  db.prepare('INSERT INTO goals (id, strength_goal, cardio_goal) VALUES (1, 4, 3)').run();
}

// Per-week goal history — one row per Mon–Sun week
db.exec(`
  CREATE TABLE IF NOT EXISTS weekly_goals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start    TEXT NOT NULL UNIQUE,
    week_end      TEXT NOT NULL,
    strength_goal INTEGER NOT NULL,
    cardio_goal   INTEGER NOT NULL
  )
`);

export default db;
