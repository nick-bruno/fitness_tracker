import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRun, useCreateRun, useUpdateRun } from '../hooks/useRuns';
import type { RunCreateInput } from '../types';

interface Props {
  activityType: 'run' | 'row';
}

const labels = {
  run: { title: 'Log a Run', editTitle: 'Edit Run', subtitle: 'Record your run details below.', placeholder: 'Morning Run', historyPath: '/runs' },
  row: { title: 'Log a Row', editTitle: 'Edit Row', subtitle: 'Record your row details below.', placeholder: 'Morning Row', historyPath: '/rows' },
};

function toLocalDatetimeString(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LogCardioPage({ activityType }: Props) {
  const navigate = useNavigate();
  const { cardioId } = useParams<{ cardioId?: string }>();
  const editId = cardioId ? parseInt(cardioId) : undefined;
  const isEdit = editId != null;
  const l = labels[activityType];

  const { data: existingRun, isLoading: loadingRun } = useRun(editId);
  const createMutation = useCreateRun();
  const updateMutation = useUpdateRun();

  const [title, setTitle] = useState('');
  const [loggedAt, setLoggedAt] = useState(() => toLocalDatetimeString(new Date().toISOString()));
  const [distanceMiles, setDistanceMiles] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingRun) {
      setTitle(existingRun.title ?? '');
      setLoggedAt(toLocalDatetimeString(existingRun.logged_at));
      setDistanceMiles(String(existingRun.distance_miles ?? ''));
      setDurationMinutes(String(Math.floor(existingRun.duration_seconds / 60)));
      setDurationSeconds(String(existingRun.duration_seconds % 60));
      setNotes(existingRun.notes ?? '');
    }
  }, [existingRun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const distance = parseFloat(distanceMiles);
    const mins = parseInt(durationMinutes || '0');
    const secs = parseInt(durationSeconds || '0');

    if (isNaN(distance) || distance <= 0) {
      setError('Please enter a valid distance.');
      return;
    }
    if (isNaN(mins) || isNaN(secs) || secs < 0 || secs > 59 || (mins === 0 && secs === 0)) {
      setError('Please enter a valid duration (at least 1 second).');
      return;
    }

    const data: RunCreateInput = {
      type: activityType,
      title: title.trim() || undefined,
      logged_at: new Date(loggedAt).toISOString(),
      distance_miles: distance,
      duration_seconds: mins * 60 + secs,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && editId != null) {
        await updateMutation.mutateAsync({ id: editId, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate(l.historyPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  if (isEdit && loadingRun) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">{isEdit ? l.editTitle : l.title}</h1>
        <p className="text-sm text-gray-500">{l.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6">
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Title <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={l.placeholder}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Date &amp; Time</label>
          <input
            type="datetime-local"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Distance (miles)</label>
          <input
            type="number"
            value={distanceMiles}
            onChange={(e) => setDistanceMiles(e.target.value)}
            placeholder="3.10"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Duration</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="28"
              min="0"
              className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-sm text-gray-400">min</span>
            <input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="30"
              min="0"
              max="59"
              className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-sm text-gray-400">sec</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Notes <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel?"
            rows={3}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : l.title}
          </button>
          <button
            type="button"
            onClick={() => navigate(l.historyPath)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
