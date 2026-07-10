import db from '../db';
import { runExistsByExternalId, createRun } from './runsService';
import type { ActivityType, FitbitStatus, FitbitSyncResult, DailySteps } from '../types';

const CLIENT_ID = process.env.FITBIT_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.FITBIT_REDIRECT_URI ?? 'http://localhost:3001/api/fitbit/callback';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const HEALTH_API_BASE = 'https://health.googleapis.com/v4/users/me';
const ACTIVITY_SCOPE = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly';

let oauthState: string | null = null;

type P = Record<string, string | number | null | bigint>;

interface FitbitTokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  fitbit_user_id: string;
  last_synced_at: string | null;
}

function getStoredTokens(): FitbitTokenRow | undefined {
  return db
    .prepare('SELECT access_token, refresh_token, expires_at, fitbit_user_id, last_synced_at FROM fitbit_tokens WHERE id = 1')
    .get() as unknown as FitbitTokenRow | undefined;
}

function storeTokens(t: Omit<FitbitTokenRow, 'last_synced_at'>): void {
  db.prepare(`
    INSERT INTO fitbit_tokens (id, access_token, refresh_token, expires_at, fitbit_user_id)
    VALUES (1, $access_token, $refresh_token, $expires_at, $fitbit_user_id)
    ON CONFLICT(id) DO UPDATE SET
      access_token   = excluded.access_token,
      refresh_token  = excluded.refresh_token,
      expires_at     = excluded.expires_at,
      fitbit_user_id = excluded.fitbit_user_id
  `).run(t as unknown as P);
}

function markSynced(): void {
  db.prepare('UPDATE fitbit_tokens SET last_synced_at = $ts WHERE id = 1')
    .run({ ts: new Date().toISOString() } as P);
}

export function getAuthorizationUrl(): string {
  oauthState = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: ACTIVITY_SCOPE,
    state: oauthState,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string, state: string): Promise<void> {
  if (!oauthState || state !== oauthState) throw new Error('Invalid OAuth state — please try connecting again');
  oauthState = null;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
  if (!data.refresh_token) {
    throw new Error('No refresh token returned — disconnect and reconnect to re-authorize');
  }

  storeTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    fitbit_user_id: 'google',
  });
}

async function getValidAccessToken(): Promise<string> {
  const stored = getStoredTokens();
  if (!stored) throw new Error('Not connected to Fitbit');

  if (new Date(stored.expires_at).getTime() - Date.now() > 5 * 60 * 1000) {
    return stored.access_token;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stored.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh access token — please reconnect');

  const data = await res.json() as { access_token: string; expires_in: number };
  storeTokens({
    access_token: data.access_token,
    refresh_token: stored.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    fitbit_user_id: stored.fitbit_user_id,
  });
  return data.access_token;
}

export function isConnected(): FitbitStatus {
  const stored = getStoredTokens();
  if (!stored) return { connected: false, lastSync: null };
  return { connected: true, lastSync: stored.last_synced_at };
}

export function disconnect(): void {
  db.prepare('DELETE FROM fitbit_tokens WHERE id = 1').run();
}

// Google Health API activity type strings → our ActivityType
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  RUNNING:           'run',
  TREADMILL:         'run',
  JOGGING:           'run',
  INDOOR_RUNNING:    'run',
  ROWING:            'row',
  ROWING_MACHINE:    'row',
  INDOOR_ROWING:     'row',
  BIKING:            'cycle',
  CYCLING:           'cycle',
  MOUNTAIN_BIKING:   'cycle',
  ROAD_BIKING:       'cycle',
  SPINNING:          'cycle',
  STATIONARY_BIKING: 'cycle',
  INDOOR_CYCLING:    'cycle',
  SWIMMING:          'swim',
  OPEN_WATER_SWIMMING: 'swim',
  POOL_SWIMMING:     'swim',
  WALKING:           'walk',
  HIKING:            'walk',
  TREADMILL_WALKING: 'walk',
  TENNIS:            'tennis',
  GOLF:              'golf',
  PICKLEBALL:        'pickleball',
};

// Name-based fallback for unmapped type strings
const NAME_MAP: Array<[RegExp, ActivityType]> = [
  [/run|jog|treadmill/i, 'run'],
  [/row/i, 'row'],
  [/bik|cycl|spin/i, 'cycle'],
  [/swim/i, 'swim'],
  [/walk|hike/i, 'walk'],
  [/tennis/i, 'tennis'],
  [/golf/i, 'golf'],
  [/pickleball/i, 'pickleball'],
];

function mapActivityType(raw: string): ActivityType | null {
  const upper = raw.toUpperCase().replace(/[\s-]/g, '_');
  if (ACTIVITY_TYPE_MAP[upper]) return ACTIVITY_TYPE_MAP[upper];
  for (const [pattern, type] of NAME_MAP) {
    if (pattern.test(raw)) return type;
  }
  return null;
}

interface ExerciseInterval {
  startTime?: string;
  endTime?: string;
}

interface ExerciseMetricsSummary {
  distanceMillimeters?: number;
}

interface ExercisePayload {
  interval?: ExerciseInterval;
  exerciseType?: string;
  displayName?: string;
  activeDuration?: string; // e.g. "1011s"
  metricsSummary?: ExerciseMetricsSummary;
}

interface HealthDataPoint {
  name: string; // stable unique ID: "users/.../dataPoints/..."
  exercise?: ExercisePayload;
  [key: string]: unknown;
}

// Session types (exercise) require civil_start_time with date-only format.
// Interval types (steps) use start_time with RFC-3339 format.
const SESSION_TYPES = new Set(['exercise']);

async function fetchHealthDataPoints(accessToken: string, dataType: string, startIso: string, endIso: string): Promise<HealthDataPoint[]> {
  let filter: string;
  if (SESSION_TYPES.has(dataType)) {
    const startDate = startIso.slice(0, 10);
    const endDate = endIso.slice(0, 10);
    filter = `${dataType}.interval.civil_start_time >= "${startDate}" AND ${dataType}.interval.civil_start_time < "${endDate}"`;
  } else {
    filter = `${dataType}.interval.start_time >= "${startIso}" AND ${dataType}.interval.start_time < "${endIso}"`;
  }
  const params = new URLSearchParams({ filter, pageSize: '1000' });
  const url = `${HEALTH_API_BASE}/dataTypes/${dataType}/dataPoints?${params}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Google Health API error (${dataType}): HTTP ${res.status} — ${JSON.stringify(body)}`);
  }

  const data = await res.json() as { dataPoints?: HealthDataPoint[]; nextPageToken?: string };
  return data.dataPoints ?? [];
}

export async function syncActivities(daysBack = 30): Promise<FitbitSyncResult> {
  const accessToken = await getValidAccessToken();
  const endIso = new Date().toISOString();
  const startIso = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const points = await fetchHealthDataPoints(accessToken, 'exercise', startIso, endIso);

  let imported = 0;
  let skipped = 0;
  const skippedTypes = new Set<string>();
  const errors: string[] = [];

  for (const point of points) {
    try {
      // point.name is the stable unique ID from Google Health
      const externalId = `ghealth:${point.name}`;
      if (runExistsByExternalId(externalId)) { skipped++; continue; }

      const ex = point.exercise;
      if (!ex) continue;

      const rawType = ex.exerciseType ?? '';
      const type = mapActivityType(rawType);
      if (!type) { skippedTypes.add(rawType || 'unknown'); continue; }

      const startTime = ex.interval?.startTime;
      const endTime = ex.interval?.endTime;
      if (!startTime || !endTime) continue;

      // Prefer activeDuration ("1011s") over wall-clock diff to exclude paused time
      let durationSeconds: number;
      if (ex.activeDuration) {
        durationSeconds = Math.round(parseFloat(ex.activeDuration));
      } else {
        durationSeconds = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      }
      if (durationSeconds <= 0) continue;

      // Distance in millimeters → miles
      let distanceMiles: number | null = null;
      const distMm = ex.metricsSummary?.distanceMillimeters;
      if (distMm != null && distMm > 0) {
        distanceMiles = distMm * 0.000000621371;
      }

      const title = ex.displayName ?? rawType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      createRun({
        type,
        title,
        logged_at: new Date(startTime).toISOString(),
        distance_miles: distanceMiles,
        duration_seconds: durationSeconds,
        source: 'fitbit',
        external_id: externalId,
      });
      imported++;
    } catch (e) {
      errors.push(`${point.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { imported, skipped, skippedTypes: [...skippedTypes], errors };
}

export async function syncDailySteps(daysBack = 7): Promise<void> {
  const accessToken = await getValidAccessToken();
  const endIso = new Date().toISOString();
  const startIso = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const points = await fetchHealthDataPoints(accessToken, 'steps', startIso, endIso);

  // Aggregate step points into daily totals.
  // Cast to any since the steps response structure is different from exercise.
  const dailyTotals = new Map<string, number>();
  for (const raw of points as unknown as Record<string, unknown>[]) {
    // Steps data point: top-level startTime and a steps sub-object or direct value
    const stepsPayload = raw.steps as Record<string, unknown> | undefined;
    const stepsInterval = stepsPayload?.interval as Record<string, unknown> | undefined;
    const startTime = ((raw.startTime ?? stepsInterval?.startTime ?? '') as string);
    const date = startTime.slice(0, 10);
    if (!date) continue;
    const count = typeof raw.count === 'number'
      ? raw.count
      : typeof stepsPayload?.count === 'number'
        ? stepsPayload.count
        : 0;
    dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + count);
  }

  for (const [date, steps] of dailyTotals) {
    if (steps === 0) continue;
    db.prepare(`
      INSERT INTO daily_steps (date, steps, source) VALUES ($date, $steps, 'fitbit')
      ON CONFLICT(date) DO UPDATE SET steps = excluded.steps
    `).run({ date, steps } as P);
  }
}

export async function sync(daysBack = 30): Promise<FitbitSyncResult> {
  const [result] = await Promise.all([
    syncActivities(daysBack),
    syncDailySteps(7),
  ]);
  markSynced();
  return result;
}

export function getDailySteps(days: number): DailySteps[] {
  return db
    .prepare(`SELECT date, steps FROM daily_steps WHERE date >= date('now', $days) ORDER BY date ASC`)
    .all({ days: `-${days} days` } as P) as unknown as DailySteps[];
}

export async function debugSteps(daysBack = 7): Promise<unknown> {
  const accessToken = await getValidAccessToken();
  const startIso = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
  const endIso = new Date().toISOString();
  const filter = `steps.interval.start_time >= "${startIso}" AND steps.interval.start_time < "${endIso}"`;
  const url = `${HEALTH_API_BASE}/dataTypes/steps/dataPoints?${new URLSearchParams({ filter, pageSize: '5' })}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const raw = await res.json();
  return { status: res.status, url, raw };
}

export async function debugSessions(daysBack = 30): Promise<unknown> {
  const accessToken = await getValidAccessToken();
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);
  const filter = `exercise.interval.civil_start_time >= "${startDate}" AND exercise.interval.civil_start_time < "${endDate}"`;
  const url = `${HEALTH_API_BASE}/dataTypes/exercise/dataPoints?${new URLSearchParams({ filter, pageSize: '10' })}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const raw = await res.json();
  return { status: res.status, url, raw };
}
