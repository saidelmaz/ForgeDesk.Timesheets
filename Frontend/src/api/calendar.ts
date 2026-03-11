import { apiClient } from './client';
import type { CalendarMonthResponse } from '@/types';

export const calendarApi = {
  getMonth: (year: number, month: number, userId?: string) =>
    apiClient.get<CalendarMonthResponse>('/api/Calendar', { params: { year, month, userId } }),
};
