import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getISOWeek, getYear } from 'date-fns';

interface FilterState {
  selectedYear: number;
  selectedWeek: number;
  setYear: (year: number) => void;
  setWeek: (week: number) => void;
  setPeriod: (year: number, week: number) => void;
}

const now = new Date();

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedYear: getYear(now),
      selectedWeek: getISOWeek(now),
      setYear: (selectedYear) => set({ selectedYear }),
      setWeek: (selectedWeek) => set({ selectedWeek }),
      setPeriod: (selectedYear, selectedWeek) => set({ selectedYear, selectedWeek }),
    }),
    {
      name: 'filter-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
