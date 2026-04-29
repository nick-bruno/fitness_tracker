import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkout, useCreateWorkout, useUpdateWorkout } from '../hooks/useWorkouts';
import type { Exercise, WorkoutDetail } from '../types';
import AddExerciseModal from '../components/workout/AddExerciseModal';
import ExerciseSetRow from '../components/workout/ExerciseSetRow';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import MuscleTagBadge from '../components/exercises/MuscleTagBadge';

let idCounter = 0;
const uid = () => `local-${++idCounter}`;

interface SetRow {
  localId: string;
  set_number: number;
  reps: string;
  weight_lb: string;
  rpe: string;
}

interface ExerciseBlock {
  localId: string;
  exercise_id: number;
  exercise_name: string;
  muscles: { muscle_group_name: string; role: string }[];
  sets: SetRow[];
}

function initFromWorkout(workout: WorkoutDetail): ExerciseBlock[] {
  return workout.exercises.map((we) => ({
    localId: uid(),
    exercise_id: we.exercise_id,
    exercise_name: we.exercise_name,
    muscles: we.muscles,
    sets: we.sets.map((s) => ({
      localId: uid(),
      set_number: s.set_number,
      reps: s.reps != null ? String(s.reps) : '',
      weight_lb: s.weight_lb != null ? String(s.weight_lb) : '',
      rpe: s.rpe != null ? String(s.rpe) : '',
    })),
  }));
}

function toISOLocal(dt: string) {
  if (!dt) return new Date().toISOString();
  return new Date(dt).toISOString();
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Sortable exercise block ─────────────────────────────────────────────────

interface SortableBlockProps {
  block: ExerciseBlock;
  onUpdateSets: (sets: SetRow[]) => void;
  onRemove: () => void;
}

function SortableBlock({ block, onUpdateSets, onRemove }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.localId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addSet = () => {
    onUpdateSets([
      ...block.sets,
      { localId: uid(), set_number: block.sets.length + 1, reps: '', weight_lb: '', rpe: '' },
    ]);
  };

  const removeSet = (localId: string) => {
    onUpdateSets(
      block.sets
        .filter((s) => s.localId !== localId)
        .map((s, i) => ({ ...s, set_number: i + 1 })),
    );
  };

  const updateSet = (localId: string, updated: SetRow) => {
    onUpdateSets(block.sets.map((s) => (s.localId === localId ? updated : s)));
  };

  const primaries = block.muscles.filter((m) => m.role === 'primary');
  const secondaries = block.muscles.filter((m) => m.role === 'secondary');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-800 bg-gray-900 p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-gray-600 hover:text-gray-400"
            title="Drag to reorder"
          >
            ⠿
          </button>
          <div>
            <p className="font-semibold text-gray-100">{block.exercise_name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {primaries.map((m) => (
                <MuscleTagBadge
                  key={m.muscle_group_name}
                  name={m.muscle_group_name}
                  role="primary"
                />
              ))}
              {secondaries.map((m) => (
                <MuscleTagBadge
                  key={m.muscle_group_name}
                  name={m.muscle_group_name}
                  role="secondary"
                />
              ))}
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="text-gray-600 hover:text-red-400" title="Remove exercise">
          ✕
        </button>
      </div>

      {/* Sets */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-6 text-center">#</span>
          <span className="w-20">Reps</span>
          <span className="w-20">Weight (lb)</span>
          <span className="w-16">RPE</span>
        </div>
        {block.sets.map((set) => (
          <ExerciseSetRow
            key={set.localId}
            set={set}
            onChange={(updated) => updateSet(set.localId, { ...updated, localId: set.localId })}
            onRemove={() => removeSet(set.localId)}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
      >
        + Add set
      </button>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function LogWorkoutPage() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId?: string }>();
  const editId = workoutId ? parseInt(workoutId) : undefined;

  const { data: existingWorkout, isLoading: loadingExisting } = useWorkout(editId);
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();

  const [title, setTitle] = useState('');
  const [loggedAt, setLoggedAt] = useState(toDatetimeLocal(new Date().toISOString()));
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseBlock[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (existingWorkout) {
      setTitle(existingWorkout.title ?? '');
      setLoggedAt(toDatetimeLocal(existingWorkout.logged_at));
      setNotes(existingWorkout.notes ?? '');
      setExercises(initFromWorkout(existingWorkout));
    }
  }, [existingWorkout]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.localId === active.id);
      const newIdx = prev.findIndex((e) => e.localId === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const addExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        localId: uid(),
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        muscles: exercise.muscles,
        sets: [{ localId: uid(), set_number: 1, reps: '', weight_lb: '', rpe: '' }],
      },
    ]);
  };

  const removeExercise = (localId: string) => {
    setExercises((prev) => prev.filter((e) => e.localId !== localId));
  };

  const updateSets = (localId: string, sets: SetRow[]) => {
    setExercises((prev) =>
      prev.map((e) => (e.localId === localId ? { ...e, sets } : e)),
    );
  };

  const handleSave = async () => {
    if (exercises.length === 0) {
      setSaveError('Add at least one exercise before saving.');
      return;
    }
    setSaveError('');

    const payload = {
      title: title.trim() || undefined,
      logged_at: toISOLocal(loggedAt),
      notes: notes || undefined,
      exercises: exercises.map((ex, i) => ({
        exercise_id: ex.exercise_id,
        sort_order: i,
        sets: ex.sets
          .filter((s) => s.reps || s.weight_lb)
          .map((s) => ({
            set_number: s.set_number,
            reps: s.reps ? parseInt(s.reps) : undefined,
            weight_lb: s.weight_lb ? parseFloat(s.weight_lb) : undefined,
            rpe: s.rpe ? parseFloat(s.rpe) : undefined,
          })),
      })).filter((ex) => ex.sets.length > 0),
    };

    if (payload.exercises.length === 0) {
      setSaveError('Please fill in at least one set with reps or weight before saving.');
      return;
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate('/history');
    } catch (err) {
      setSaveError((err as Error).message || 'Failed to save workout.');
    }
  };

  if (editId && loadingExisting) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">
          {editId ? 'Edit Workout' : 'Log Workout'}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          ← Back
        </button>
      </div>

      {/* Title, date & notes */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. "Biceps and Back"'
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Date & Time</label>
          <input
            type="datetime-local"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it go?"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Exercise blocks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={exercises.map((e) => e.localId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {exercises.map((ex) => (
              <SortableBlock
                key={ex.localId}
                block={ex}
                onUpdateSets={(sets) => updateSets(ex.localId, sets)}
                onRemove={() => removeExercise(ex.localId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {exercises.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-800 py-10 text-center">
          <p className="text-gray-500">No exercises added yet.</p>
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-xl border border-dashed border-indigo-800 py-3 text-sm font-medium text-indigo-400 hover:border-indigo-600 hover:text-indigo-300"
      >
        + Add Exercise
      </button>

      {saveError && <ErrorBanner message={saveError} />}

      <div className="flex gap-3 pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving && <LoadingSpinner size="sm" />}
          {isSaving ? 'Saving...' : editId ? 'Update Workout' : 'Save Workout'}
        </button>
      </div>

      {showModal && (
        <AddExerciseModal onSelect={addExercise} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
