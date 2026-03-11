import { create } from 'zustand';
import { startOfWeek, format } from 'date-fns';

interface TimesheetState {
  selectedWeekStart: string;
  selectedUserId: string | null;
  setSelectedWeek: (date: Date) => void;
  setSelectedUserId: (userId: string | null) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
}

export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  selectedWeekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  selectedUserId: null,

  setSelectedWeek: (date) => set({ selectedWeekStart: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd') }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),

  goToPreviousWeek: () => {
    const current = new Date(get().selectedWeekStart);
    current.setDate(current.getDate() - 7);
    set({ selectedWeekStart: format(startOfWeek(current, { weekStartsOn: 1 }), 'yyyy-MM-dd') });
  },

  goToNextWeek: () => {
    const current = new Date(get().selectedWeekStart);
    current.setDate(current.getDate() + 7);
    set({ selectedWeekStart: format(startOfWeek(current, { weekStartsOn: 1 }), 'yyyy-MM-dd') });
  },

  goToCurrentWeek: () => set({ selectedWeekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }),
}));
