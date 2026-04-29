import { useState } from 'react';
import type { Exercise } from '../../types';
import { useExercises } from '../../hooks/useExercises';
import ExerciseSearchBar from '../exercises/ExerciseSearchBar';
import ExerciseCard from '../exercises/ExerciseCard';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function AddExerciseModal({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises({ search });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="font-semibold text-gray-100">Add Exercise</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="px-5 py-3">
          <ExerciseSearchBar value={search} onChange={setSearch} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="flex justify-center pt-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {exercises?.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selectable
                  onSelect={(e) => {
                    onSelect(e);
                    onClose();
                  }}
                />
              ))}
              {exercises?.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No exercises found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
