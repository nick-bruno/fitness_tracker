import AdmZip from 'adm-zip';
import { z } from 'zod';
import type { RunCreateInput, NrcImportResult } from '../types';

const MetricValue = z.object({ value: z.number() });

const NrcActivity = z
  .object({
    id: z.string(),
    type: z.string(),
    start_epoch_ms: z.number(),
    active_duration_ms: z.number(),
    metrics: z
      .array(
        z.object({
          type: z.string(),
          unit: z.string().optional(),
          values: z.array(MetricValue),
        }),
      )
      .optional(),
    tags: z.record(z.unknown()).optional(),
  })
  .passthrough();

export function parseNrcZip(buffer: Buffer): {
  runs: RunCreateInput[];
  result: NrcImportResult;
} {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter((e) => e.entryName.match(/^activities\/.*\.json$/i) && !e.isDirectory);

  const runs: RunCreateInput[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    const name = entry.entryName;
    try {
      const raw = JSON.parse(entry.getData().toString('utf-8'));
      const parsed = NrcActivity.safeParse(raw);
      if (!parsed.success) {
        errors.push(`${name}: unexpected format`);
        continue;
      }
      const act = parsed.data;

      if (act.type.toLowerCase() !== 'run') continue;

      const distanceMetric = act.metrics?.find(
        (m) => m.type === 'distance' && m.unit === 'km',
      );
      if (!distanceMetric || distanceMetric.values.length === 0) {
        errors.push(`${name}: missing distance data`);
        continue;
      }

      const distanceKm = distanceMetric.values[distanceMetric.values.length - 1].value;
      const distanceMiles = distanceKm * 0.621371;
      const durationSeconds = Math.round(act.active_duration_ms / 1000);
      const loggedAt = new Date(act.start_epoch_ms).toISOString();
      const title = (act.tags?.['com.nike.name'] as string | undefined) ?? undefined;

      runs.push({
        type: 'run',
        title,
        logged_at: loggedAt,
        distance_miles: distanceMiles,
        duration_seconds: durationSeconds,
        source: 'nrc',
        external_id: act.id,
      });
    } catch {
      errors.push(`${name}: failed to parse JSON`);
    }
  }

  return {
    runs,
    result: { imported: 0, skipped: 0, errors },
  };
}
