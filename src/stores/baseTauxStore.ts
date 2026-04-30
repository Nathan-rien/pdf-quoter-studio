import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BASE_TAUX_DATA, BaseTauxEntry } from '@/data/base-taux';

interface BaseTauxState {
  entries: BaseTauxEntry[];
  updateEntry: (index: number, patch: Partial<BaseTauxEntry>) => void;
  setAll: (entries: BaseTauxEntry[]) => void;
  reset: () => void;
}

export const useBaseTauxStore = create<BaseTauxState>()(
  persist(
    (set) => ({
      entries: [...BASE_TAUX_DATA],
      updateEntry: (index, patch) =>
        set((state) => {
          const next = [...state.entries];
          if (!next[index]) return state;
          next[index] = { ...next[index], ...patch };
          return { entries: next };
        }),
      setAll: (entries) => set({ entries: [...entries] }),
      reset: () => set({ entries: [...BASE_TAUX_DATA] }),
    }),
    {
      name: 'base-taux-runtime',
      version: 1,
    }
  )
);

/**
 * Accesseur runtime hors React (pour les fonctions de calcul pures).
 */
export function getBaseTauxRuntime(): BaseTauxEntry[] {
  return useBaseTauxStore.getState().entries;
}
