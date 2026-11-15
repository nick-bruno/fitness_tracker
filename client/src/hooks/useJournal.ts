import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJournalEntries, fetchJournalEntry, saveJournalEntry, deleteJournalEntry } from '../api/client';

export function useJournalEntries(limit = 30) {
  return useQuery({
    queryKey: ['journal', 'list', limit],
    queryFn: () => fetchJournalEntries(limit),
  });
}

export function useJournalEntry(date: string) {
  return useQuery({
    queryKey: ['journal', 'entry', date],
    queryFn: () => fetchJournalEntry(date),
  });
}

export function useSaveJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, rating, body }: { date: string; rating: number | null; body: string }) =>
      saveJournalEntry(date, { rating, body }),
    onSuccess: (entry) => {
      qc.setQueryData(['journal', 'entry', entry.date], entry);
      qc.invalidateQueries({ queryKey: ['journal', 'list'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => deleteJournalEntry(date),
    onSuccess: (_r, date) => {
      qc.setQueryData(['journal', 'entry', date], null);
      qc.invalidateQueries({ queryKey: ['journal', 'list'] });
    },
  });
}
