# Fitness Tracker — Architecture Guide

A personal, single-user fitness tracking web app with AI-powered workout recommendations via the Claude API.

**Last active session:** 2026-07-05

---

## Running the App

```bash
# From repo root — starts both servers
npm run dev

# Seed the database (run once after cloning)
npm run seed

# Import exercises from the Wger public API (safe to re-run — uses INSERT OR IGNORE)
npm run import-wger
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- Vite proxies all `/api` requests from 5173 → 3001, so the client never hard-codes the server port.

---

## Monorepo Structure

```
/fitness_tracker
├── .env                        # ANTHROPIC_API_KEY, PORT=3001, DB_PATH=fitness.db
├── .env.example                # Safe template to commit (no secrets)
├── fitness.db                  # SQLite database (gitignored)
├── package.json                # Root workspace — concurrently runs both servers
├── /client                     # React frontend (Vite, port 5173)
│   └── /src
│       ├── App.tsx             # Router setup (React Router v6)
│       ├── /pages              # One file per route
│       ├── /components
│       │   ├── /dashboard      # BodySilhouette, WeeklyGoalsCard
│       │   ├── /exercises      # MuscleGroupFilter, ExerciseCard, MuscleTagBadge
│       │   ├── /workout        # AddExerciseModal, CopyWorkoutModal, ExerciseSetRow
│       │   ├── /recommendations# MuscleHeatmap
│       │   └── /shared         # LoadingSpinner, ErrorBanner
│       ├── /hooks              # TanStack Query hooks (data fetching)
│       ├── /api/client.ts      # All fetch() calls to the API live here
│       └── /types/index.ts     # Shared TypeScript interfaces
└── /server                     # Express backend (tsx watch, port 3001)
    └── /src
        ├── index.ts            # Express app + route mounting
        ├── db.ts               # SQLite setup, schema creation, migrations
        ├── /routes             # Request validation (Zod) + response shaping
        ├── /services           # Business logic + SQL queries
        ├── /scripts            # One-off utilities (importWger.ts)
        ├── /seed               # One-time data seed (muscle groups + exercises)
        └── /types/index.ts     # Server-side TypeScript interfaces
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Client state | TanStack Query (React Query v5) |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | Express + TypeScript (tsx watch in dev) |
| Database | Node.js built-in `node:sqlite` (DatabaseSync) |
| Validation | Zod (all POST/PUT request bodies) |
| AI | `@anthropic-ai/sdk` — Claude API (server-side only) |
| Dev runner | concurrently (both servers with one `npm run dev`) |
| File upload | multer (memoryStorage) — NRC zip import |
| Zip parsing | adm-zip — pure-JS, no native compilation |

> **Why `node:sqlite` and not `better-sqlite3`?** `better-sqlite3` requires native compilation and fails on macOS 15 / Node 24 (`fatal error: 'climits' file not found`). The built-in `node:sqlite` module needs no compilation and has a nearly identical synchronous API.

---

## Database Schema

Managed in `server/src/db.ts`. Schema is created on startup; migrations are applied via `PRAGMA table_info()` checks + `ALTER TABLE`.

```
muscle_groups        id, name, parent_id → muscle_groups(id)   (self-referential, 2 levels)
exercises            id, name, description, equipment, movement_pattern, created_at
exercise_muscle_groups  exercise_id, muscle_group_id, role ('primary'|'secondary')
workouts             id, title, logged_at (ISO-8601), notes, location
workout_exercises    id, workout_id, exercise_id, sort_order
sets                 id, workout_exercise_id, set_number, reps, weight_lb, rpe, notes
runs                 id, type ('run'|'row'), title, logged_at, distance_miles, duration_seconds, notes, source, external_id
goals                id (always 1), strength_goal, cardio_goal   ← default weekly targets
weekly_goals         id, week_start (ISO), week_end (ISO), strength_goal, cardio_goal
```

Seed data: ~33 muscle groups (6 top-level, ~27 sub-muscles) and ~63 seed exercises + ~585 imported from Wger. Run `npm run seed` once, then `npm run import-wger` to populate the full library.

`runs.external_id` has a partial unique index (`WHERE external_id IS NOT NULL`) for NRC import deduplication.

**Migrations applied at startup:**
1. Add `title` to `workouts`
2. Rename `weight_kg` → `weight_lb` in `sets`
3. Add `type` to `runs`
4. Add `source` + `external_id` to `runs`
5. Add `location` to `workouts`

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/muscle-groups` | Full two-level hierarchy |
| GET | `/api/exercises` | List/search (`?search=&muscleGroupId=&equipment=&role=`) — `muscleGroupId` matches the group OR any of its children |
| GET | `/api/exercises/:id` | Exercise detail with muscles |
| POST | `/api/exercises` | Create custom exercise |
| PUT | `/api/exercises/:id` | Update exercise |
| DELETE | `/api/exercises/:id` | Delete exercise |
| GET | `/api/workouts` | Paginated history (`?limit=&offset=&from=&to=`) |
| GET | `/api/workouts/:id` | Full workout detail with sets |
| POST | `/api/workouts` | Log a new workout |
| PUT | `/api/workouts/:id` | Edit existing workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| GET | `/api/workouts/muscle-summary` | Per-muscle set counts for a lookback window |
| POST | `/api/recommendations` | Generate AI recommendation (calls Claude) |
| GET | `/api/runs` | Paginated run/row history (`?limit=&offset=&from=&to=&type=`) |
| GET | `/api/runs/summary` | Weekly totals (`?days=&type=`) |
| GET | `/api/runs/:id` | Single run/row detail |
| POST | `/api/runs` | Log a run or row |
| PUT | `/api/runs/:id` | Edit existing run/row |
| DELETE | `/api/runs/:id` | Delete run/row |
| POST | `/api/runs/import/nrc` | Import NRC `.zip` export (multipart/form-data) |
| GET | `/api/goals` | Current week's goals + live completion counts |
| PUT | `/api/goals` | Update current week's goals (also updates `goals` default) |
| GET | `/api/goals/history` | Past weeks with goals + completions (`?weeks=12`) |

> **Route order matters:** `/api/workouts/muscle-summary` must be registered before `/api/workouts/:id`, `/api/runs/import/nrc` before `/api/runs/:id`, and `/api/goals/history` before `/api/goals` (implied by Express router order).

---

## Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Weekly goals rings, weekly summary stats, body heatmap, muscle coverage, last 3 workouts |
| Exercise Library | `/exercises` | Search + filter by muscle group / equipment |
| Log Workout | `/log` | Create workout — date+hour picker, gym location toggle, copy-from-previous, drag-to-reorder, Tab-to-add-set |
| Edit Workout | `/log/:workoutId` | Pre-populates form from existing workout |
| Workout History | `/history` | Paginated list with date range filter |
| Recommendations | `/recommendations` | Goal selector → Claude AI suggestion |
| Log Run | `/log-run` | Log a running activity (distance + duration) |
| Edit Run | `/log-run/:cardioId` | Edit an existing run |
| Run History | `/runs` | Paginated run list with weekly summary + NRC zip import |
| Log Row | `/log-row` | Log a rowing activity |
| Edit Row | `/log-row/:cardioId` | Edit an existing row |
| Row History | `/rows` | Paginated row list with weekly summary |

`LogCardioPage` and `CardioHistoryPage` are shared components parameterized by `activityType: 'run' | 'row'`.

---

## Dashboard Components

### `WeeklyGoalsCard`
Two SVG circular progress rings (indigo = strength, emerald = cardio) showing completed vs. goal for the current Mon–Sun week. Goals are stored per-week in `weekly_goals` — each new week auto-seeds from the most recent past week's goals. A collapsible history section shows past weeks with met/missed indicators. Refreshes every 60 seconds.

### `BodySilhouette`
SVG front + back human body diagram with organic bezier muscle regions. Each region is colour-coded by the 7-day muscle summary (red = trained today → green = this week → dark = untrained). Hover shows a tooltip with muscle name, set count, and last trained date. Muscle → region mapping lives in `MUSCLE_TO_REGION` within the component.

### `MuscleHeatmap`
Existing badge grid grouped by parent muscle (Chest, Back, …). Sits above `BodySilhouette` in the dashboard.

---

## Log Workout — Key UX Details

- **Date/time picker:** Separate `<input type="date">` + hour `<select>` (12 AM–11 PM). Minutes always stored as `:00`.
- **Tab-to-add-set:** Pressing Tab on the RPE field of the *last* set in an exercise block adds a new set and auto-focuses its Reps input. Implemented in `ExerciseSetRow` (`isLast` + `onAddSet` props) + a `useEffect` + container ref in `SortableBlock`.
- **Copy from previous workout:** "Copy previous" button opens `CopyWorkoutModal` — lists the 30 most recent workouts; selecting one calls `fetchWorkout(id)` and calls `initFromWorkout()` to pre-populate all exercises and set data. Title/date stay as fresh defaults.
- **Location toggle:** Two buttons — "Latitude Gym" / "Onelife Gym" — stored in `workouts.location`. Clicking the active button deselects it (blank = home/unspecified).

---

## Exercise Library

**1,903 exercises total** across three sources:
- 63 hand-curated seed exercises
- ~585 from the Wger public API
- 1,254 new from the hasaneyldrm/exercises-dataset (41 existing records updated)

### Import scripts

**Wger import (`server/src/scripts/importWger.ts`)** — `npm run import-wger`
- Fetches from `https://wger.de/api/v2/exerciseinfo/?language=2` (English only)
- Maps Wger muscle IDs → our sub-muscle names, equipment names → our equipment strings, categories → movement patterns
- Skips cardio exercises and exercises with no mappable muscles
- Strips HTML from descriptions
- `INSERT OR IGNORE` — safe to re-run; won't duplicate

**exercises-dataset import (`server/src/scripts/importExerciseDataset.ts`)** — `npm run import-dataset`
- Source: `https://github.com/hasaneyldrm/exercises-dataset` (1,324 exercises, JSON)
- **Dataset takes deduplication priority** — exercises matched by name have their description, equipment, movement_pattern, and muscle groups overwritten with the dataset's version; new exercises are inserted
- Skips `category: cardio` and `target: cardiovascular system`
- Maps 28 equipment types → our 5 canonical values:
  - `Barbell`: barbell, ez barbell, olympic barbell, smith machine, trap bar
  - `Dumbbell`: dumbbell, kettlebell, hammer, weighted
  - `Cable`: cable, band, resistance band, rope
  - `Machine`: leverage machine, assisted, sled machine
  - `Bodyweight`: body weight, bosu ball, medicine ball, roller, stability ball, tire, wheel roller
- Maps 19 `target` values → primary muscle sub-group via `TARGET_MAP`
- Maps 41 `secondary_muscles` labels → secondary sub-groups via `SECONDARY_MAP` (unmappable entries cleanly skipped)
- Safe to re-run — produces 0 new inserts if dataset hasn't changed

**Muscle group filter (`muscleGroupId` query param):**
The filter subquery joins `muscle_groups` and checks `mg.id = $mgId OR mg.parent_id = $mgId` — so passing a top-level group ID (e.g., Chest) returns exercises tagged with any of its sub-muscles (Upper Pec, Mid/Sternal Pec, Lower Pec).

**`AddExerciseModal` chips:** Chest · Back · Shoulders · Biceps · Triceps · Legs · Core. "Biceps" and "Triceps" are `subset` chips — they pre-filter to the Arms parent server-side then apply a name regex client-side (`/bicep|brachialis/i` and `/tricep/i`).

---

## Weekly Goals (`goalService.ts`)

- `goals` table: single row (id=1), stores the default targets carried into new weeks.
- `weekly_goals` table: one row per Mon–Sun week (`week_start` ISO = Monday 00:00:00 local, `week_end` = Sunday 23:59:59 local).
- `ensureCurrentWeek()`: called on every `GET /api/goals` — creates the current week's row if absent, seeding from the most recent `weekly_goals` row (or `goals` defaults).
- `updateGoals()`: UPSERTs `weekly_goals` for the current week AND updates `goals` so future weeks inherit the new targets.
- `getGoalsHistory()`: correlated subquery counts workouts/runs within each stored week's bounds; marks `strength_met` and `cardio_met` booleans.

---

## AI Recommendations (`claudeService.ts`)

Called server-side only — the `ANTHROPIC_API_KEY` is never sent to the browser.

**Context sent to Claude:**
1. User-selected goals (e.g., `["Strength", "Muscle Balance"]`)
2. Muscle volume summary: sets per sub-muscle + last trained date (configurable lookback window)
3. Recent workout history (last N workouts, capped for token budget)
4. Full exercise library (id, name, primary muscle)

**Model:** `claude-sonnet-4-6`, `max_tokens: 1500`, `temperature: 0.4`

Prompt caching (`cache_control: { type: "ephemeral" }`) is applied to the system prompt and exercise library block to reduce cost on repeated calls.

**Response schema:**
```typescript
{
  target_muscle_groups: { muscle_group_name, priority: 'high'|'medium'|'low', reason }[]
  suggested_exercises:  { exercise_id, exercise_name, sets, rep_range, rationale }[]
  overall_reasoning: string
  generated_at: string
}
```

Recommendations are stateless and not persisted to the database.

---

## Key Implementation Notes

- **`node:sqlite` typing:** Query results must be cast with `as unknown as TargetType`. Named params must be typed as `Record<string, string | number | null | bigint>` — the driver rejects `unknown`. Every named param in the object must appear in the SQL string, or the driver throws "Unknown named parameter".
- **DB path:** Always resolved relative to `__dirname` in `db.ts` (not `process.cwd()`) so the path is correct regardless of which directory the server is started from.
- **`LogWorkoutPage`** is the most complex component: local `ExerciseBlock[]` state manages the full form, `@dnd-kit` handles drag-to-reorder, and sets are filtered (must have reps or weight) before the payload is built.
- **NRC import:** Uses `adm-zip` (pure-JS, no native compilation) + `multer` memoryStorage. Parses `activities/*.json` from the Nike data export zip. Distance converted from km, duration from ms. Deduplicates via `external_id`. Non-fatal per-file errors are collected and returned without aborting the whole import. The `importNrcRuns` client function uses raw `FormData` — do NOT set `Content-Type` manually (browser must set the multipart boundary).
- **`BodySilhouette` SVG:** ViewBox `0 0 420 540`. Front figure at cx=105, back at cx=315 (offset +210). Each body section (torso, arms, legs) is a separate dark background path; muscle regions overlay with bezier curves. `hp(regionKey)` spreads `onMouseEnter`/`onMouseMove`/`onMouseLeave` onto every coloured element for the custom tooltip.
