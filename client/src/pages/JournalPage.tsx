import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useJournalEntries, useJournalEntry, useSaveJournalEntry, useDeleteJournalEntry } from '../hooks/useJournal';
import type { JournalEntry } from '../types';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import { isDarkMode } from '../components/goals/goalCategories';

// ── Local-date helpers (entries are keyed by the local calendar day) ─────────

function toLocalDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const parseLocal = (date: string) => new Date(`${date}T12:00:00`);

function shiftDate(date: string, days: number): string {
  const d = parseLocal(date);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

function dayLabel(date: string): string {
  const today = toLocalDate(new Date());
  if (date === today) return 'Today';
  if (date === shiftDate(today, -1)) return 'Yesterday';
  return parseLocal(date).toLocaleDateString('en-US', { weekday: 'long' });
}

const longDate = (date: string) =>
  parseLocal(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const shortDate = (date: string) =>
  parseLocal(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// ── Rating ───────────────────────────────────────────────────────────────────

function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label="Rate your day from 1 to 10" className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : n)}
            className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
              selected
                ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
                : value !== null && n < value
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-3)]">–</span>;
  }
  return (
    <span className="rounded-md bg-[var(--accent-light)] px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
      {rating}/10
    </span>
  );
}

// ── Rating trend chart ───────────────────────────────────────────────────────

const TREND_RANGES = [
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: 365, label: '1y' },
] as const;

interface TrendPoint {
  date: string;
  label: string;
  rating: number | null;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendPoint }[] }) {
  const p = payload?.[0]?.payload;
  if (!active || !p || p.rating === null) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text-1)]">{shortDate(p.date)}</p>
      <p className="text-[var(--text-2)]">Rating: <span className="font-medium text-[var(--text-1)]">{p.rating}/10</span></p>
    </div>
  );
}

function RatingTrendChart({ entries, selectedDate, onSelect }: {
  entries: JournalEntry[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [days, setDays] = useState<(typeof TREND_RANGES)[number]['days']>(30);
  const today = toLocalDate(new Date());
  const start = shiftDate(today, -(days - 1));

  // One point per calendar day so gaps (no entry / no rating) show as breaks in the line
  const byDate = new Map(entries.map((e) => [e.date, e.rating]));
  const data: TrendPoint[] = [];
  for (let d = start; d <= today; d = shiftDate(d, 1)) {
    data.push({
      date: d,
      label: parseLocal(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: byDate.get(d) ?? null,
    });
  }
  const rated = data.filter((p) => p.rating !== null);
  const avg = rated.length ? rated.reduce((s, p) => s + p.rating!, 0) / rated.length : null;

  const dark = isDarkMode();
  const lineColor = dark ? '#818CF8' : '#6366F1';
  const avgColor = dark ? '#9E9890' : '#57534E';

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-1)]">Rating trend</h2>
          <p className="text-xs text-[var(--text-3)]">
            {avg === null
              ? 'No ratings in this period'
              : <>Avg <span className="font-semibold text-[var(--text-1)]">{avg.toFixed(1)}</span> across {rated.length} rated day{rated.length === 1 ? '' : 's'} · click a point to open it</>}
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-0.5" role="tablist" aria-label="Trend range">
          {TREND_RANGES.map((r) => (
            <button
              key={r.days}
              role="tab"
              aria-selected={days === r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                days === r.days ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {rated.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-3)]">
          Rate a few days to see your trend.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            onClick={(state) => {
              const p = (state as { activePayload?: { payload: TrendPoint }[] } | null)?.activePayload?.[0]?.payload;
              if (p && p.rating !== null) onSelect(p.date);
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }}
              interval="preserveStartEnd" minTickGap={24} />
            <YAxis domain={[1, 10]} ticks={[1, 4, 7, 10]} allowDecimals={false} axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
            {avg !== null && (
              <ReferenceLine y={avg} stroke={avgColor} strokeDasharray="4 4" strokeWidth={1}
                label={{ value: `avg ${avg.toFixed(1)}`, position: 'insideTopRight', fontSize: 10, fill: avgColor }} />
            )}
            <Line
              dataKey="rating" type="monotone" stroke={lineColor} strokeWidth={2} connectNulls={false}
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: TrendPoint; index?: number }) => {
                const { cx, cy, payload, index } = props;
                if (cx == null || cy == null || !payload || payload.rating === null) return <g key={index} />;
                const sel = payload.date === selectedDate;
                return (
                  <circle key={index} cx={cx} cy={cy} r={sel ? 6 : 4} fill={lineColor}
                    stroke="var(--bg-card)" strokeWidth={2} style={{ cursor: 'pointer' }} />
                );
              }}
              activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2, style: { cursor: 'pointer' } }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Editor for one day ───────────────────────────────────────────────────────

function EntryEditor({ date, entry, onDirtyChange }: {
  date: string;
  entry: JournalEntry | null;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const save = useSaveJournalEntry();
  const remove = useDeleteJournalEntry();
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [body, setBody] = useState(entry?.body ?? '');

  const dirty = rating !== (entry?.rating ?? null) || body !== (entry?.body ?? '');
  const canSave = dirty && (rating !== null || body.trim() !== '');

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const handleSave = () => {
    if (!canSave || save.isPending) return;
    save.mutate({ date, rating, body });
  };

  const handleDelete = async () => {
    if (!entry || !confirm(`Delete your journal entry for ${longDate(date)}?`)) return;
    await remove.mutateAsync(date);
    setRating(null);
    setBody('');
  };

  let status: string;
  if (save.isPending) status = 'Saving…';
  else if (save.isError) status = `Couldn’t save: ${save.error.message}`;
  else if (dirty) status = 'Unsaved changes';
  else if (entry) status = `Saved ${new Date(entry.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  else status = 'No entry yet';

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-[var(--text-1)]">How was your day?</p>
          <p className="text-xs text-[var(--text-3)]">{rating === null ? 'Tap to rate' : `${rating} / 10`}</p>
        </div>
        <RatingPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="journal-body" className="mb-2 block text-sm font-medium text-[var(--text-1)]">
          Journal
        </label>
        <textarea
          id="journal-body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="What happened today? How did you feel, sleep, eat, train…"
          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${save.isError ? 'text-red-500' : 'text-[var(--text-3)]'}`}>{status}</p>
        <div className="flex items-center gap-2">
          {entry && (
            <button
              onClick={handleDelete}
              disabled={remove.isPending}
              className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-3)] hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave || save.isPending}
            title="Save (⌘/Ctrl + Enter)"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 transition-all"
          >
            {save.isPending && <LoadingSpinner size="sm" />}
            Save entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const today = toLocalDate(new Date());
  const [date, setDate] = useState(today);
  const [dirty, setDirty] = useState(false);
  const { data: entry, isLoading, error } = useJournalEntry(date);
  const { data: list } = useJournalEntries(365); // covers the 1-year trend; list below shows the latest 60

  const goTo = (next: string) => {
    if (next === date || next > today) return;
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setDirty(false);
    setDate(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const entries = list?.entries ?? [];
  const rated = entries.filter((e) => e.rating !== null);
  const recent = rated.slice(0, 7);
  const avg = (xs: JournalEntry[]) => (xs.length ? xs.reduce((s, e) => s + e.rating!, 0) / xs.length : null);
  const avg7 = avg(recent);
  const avgAll = avg(rated);

  const navBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] disabled:cursor-not-allowed disabled:opacity-30 transition-colors';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)]">Daily Journal</h1>
        <p className="mt-0.5 text-sm text-[var(--text-3)]">Write about your day and rate it from 1 to 10.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">{dayLabel(date)}</h2>
            <p className="text-xs text-[var(--text-3)]">{longDate(date)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goTo(shiftDate(date, -1))} className={navBtn} title="Previous day" aria-label="Previous day">‹</button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && goTo(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-2)]"
              aria-label="Pick a date"
            />
            <button onClick={() => goTo(shiftDate(date, 1))} disabled={date >= today} className={navBtn} title="Next day" aria-label="Next day">›</button>
            {date !== today && (
              <button onClick={() => goTo(today)} className="ml-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] hover:text-[var(--text-1)]">
                Today
              </button>
            )}
          </div>
        </div>

        {error && <ErrorBanner message={(error as Error).message} />}
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          // Remount per date/entry so the form resets to the stored values
          <EntryEditor key={`${date}-${entry?.updated_at ?? 'new'}`} date={date} entry={entry ?? null} onDirtyChange={setDirty} />
        )}
      </div>

      <RatingTrendChart entries={entries} selectedDate={date} onSelect={goTo} />

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--text-1)]">Past entries</h2>
          {avg7 !== null && (
            <p className="text-xs text-[var(--text-3)]">
              Avg rating: <span className="font-semibold text-[var(--text-1)]">{avg7.toFixed(1)}</span> last {recent.length}
              {avgAll !== null && rated.length > recent.length && (
                <> · <span className="font-semibold text-[var(--text-1)]">{avgAll.toFixed(1)}</span> last {rated.length}</>
              )}
            </p>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-3)]">
            Your entries will appear here.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.slice(0, 60).map((e) => (
              <li key={e.date}>
                <button
                  onClick={() => goTo(e.date)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    e.date === date
                      ? 'border-indigo-300 bg-[var(--accent-light)] dark:border-indigo-800'
                      : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text-1)]">{shortDate(e.date)}</p>
                    <RatingBadge rating={e.rating} />
                  </div>
                  {e.body.trim() && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-[var(--text-2)]">{e.body}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
