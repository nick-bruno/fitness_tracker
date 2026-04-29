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

export default db;
