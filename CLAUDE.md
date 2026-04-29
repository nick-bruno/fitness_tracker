# Fitness Tracker — Architecture Guide

A personal, single-user fitness tracking web app with AI-powered workout recommendations via the Claude API.

---

## Running the App

```bash
# From repo root — starts both servers
npm run dev

# Seed the database (run once after cloning)
npm run seed
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
│       ├── /components         # Reusable UI components
│       ├── /hooks              # TanStack Query hooks (data fetching)
│       ├── /api/client.ts      # All fetch() calls to the API live here
│       └── /types/index.ts     # Shared TypeScript interfaces
└── /server                     # Express backend (tsx watch, port 3001)
    └── /src
        ├── index.ts            # Express app + route mounting
        ├── db.ts               # SQLite setup, schema creation, migrations
        ├── /routes             # Request validation (Zod) + response shaping
        ├── /services           # Business logic + SQL queries
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

> **Why `node:sqlite` and not `better-sqlite3`?** `better-sqlite3` requires native compilation and fails on macOS 15 / Node 24 (`fatal error: 'climits' file not found`). The built-in `node:sqlite` module needs no compilation and has a nearly identical synchronous API.

---

## Database Schema

Managed in `server/src/db.ts`. Schema is created on startup; migrations are applied via `PRAGMA table_info()` checks + `ALTER TABLE`.

```
muscle_groups        id, name, parent_id → muscle_groups(id)   (self-referential, 2 levels)
exercises            id, name, description, equipment, movement_pattern, created_at
exercise_muscle_groups  exercise_id, muscle_group_id, role ('primary'|'secondary')
workouts             id, title, logged_at (ISO-8601), notes
workout_exercises    id, workout_id, exercise_id, sort_order
sets                 id, workout_exercise_id, set_number, reps, weight_lb, rpe, notes
```

Seed data: ~33 muscle groups (6 top-level, ~27 sub-muscles) and ~63 exercises. Run once with `npm run seed`.

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/muscle-groups` | Full two-level hierarchy |
| GET | `/api/exercises` | List/search (`?search=&muscleGroupId=&equipment=&role=`) |
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

> **Route order matters:** `/api/workouts/muscle-summary` must be registered before `/api/workouts/:id` in Express to prevent "muscle-summary" being parsed as a numeric ID.

---

## Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Weekly summary, last 3 workouts, muscle heatmap |
| Exercise Library | `/exercises` | Search + filter by muscle group / equipment |
| Log Workout | `/log` | Create a new workout with drag-to-reorder exercises and inline set entry |
| Edit Workout | `/log/:workoutId` | Pre-populates form from existing workout |
| Workout History | `/history` | Paginated list with date range filter |
| Recommendations | `/recommendations` | Goal selector → Claude AI suggestion |

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
- **Migrations:** Two applied at startup — (1) add `title` column to `workouts`, (2) rename `weight_kg` → `weight_lb` in `sets`.
- **`LogWorkoutPage`** is the most complex component: local `ExerciseBlock[]` state manages the full form, `@dnd-kit` handles drag-to-reorder, and sets are filtered (must have reps or weight) before the payload is built.
