import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calendarApi } from '@/api/calendar';
import type { CalendarDay } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  TrendingUp,
  Palmtree,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday as isDateToday,
  getDay,
} from 'date-fns';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_PROJECT_COLORS = [
  '#4f46e5', '#0d9488', '#d97706', '#e11d48', '#7c3aed',
  '#0891b2', '#059669', '#dc2626', '#2563eb', '#c026d3',
];

function getProjectColor(color?: string, index: number = 0): string {
  return color || DEFAULT_PROJECT_COLORS[index % DEFAULT_PROJECT_COLORS.length];
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => calendarApi.getMonth(year, month).then(res => res.data),
  });

  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Build the full calendar grid (including padding days from prev/next month)
  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const dayMap = new Map<string, CalendarDay>();

    if (calendarData?.days) {
      for (const day of calendarData.days) {
        dayMap.set(day.date, day);
      }
    }

    return allDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const inMonth = isSameMonth(date, currentDate);
      const today = isDateToday(date);
      const dow = getDay(date);
      const isWeekend = dow === 0 || dow === 6;
      const apiDay = dayMap.get(dateStr);

      return {
        date,
        dateStr,
        inMonth,
        today,
        isWeekend,
        isWorkingDay: apiDay?.isWorkingDay ?? !isWeekend,
        entries: apiDay?.entries ?? [],
        leaveRequests: apiDay?.leaveRequests ?? [],
        totalHours: apiDay?.totalHours ?? 0,
        scheduledHours: apiDay?.scheduledHours ?? 0,
      };
    });
  }, [currentDate, calendarData]);

  const totalHours = calendarData?.monthTotalHours ?? 0;
  const scheduledHours = calendarData?.monthScheduledHours ?? 0;
  const utilization = scheduledHours > 0 ? Math.round((totalHours / scheduledHours) * 100) : 0;

  const handleDayClick = (dateStr: string) => {
    navigate(`/entries/new?date=${dateStr}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="rounded-r-none border-r border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="rounded-none px-3"
            >
              <CalendarDays className="w-4 h-4 mr-1.5" />
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="rounded-l-none border-l border-slate-200 dark:border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Total Hours
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {totalHours.toFixed(1)}h
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/20">
              <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                Scheduled
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {scheduledHours.toFixed(0)}h
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  Utilization
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {utilization}%
                </p>
              </div>
              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full ml-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(utilization, 100)}%`,
                    backgroundColor: utilization >= 100 ? '#0d9488' : utilization >= 75 ? '#4f46e5' : '#d97706',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              {/* Weekday Header */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <div
                    key={label}
                    className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                      idx >= 5
                        ? 'text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7">
                {calendarGrid.map((day, index) => {
                  const isLastRow = index >= calendarGrid.length - 7;
                  const isLastCol = (index + 1) % 7 === 0;

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => day.inMonth && handleDayClick(day.dateStr)}
                      className={`
                        relative min-h-[110px] lg:min-h-[130px] p-1.5 lg:p-2
                        border-b border-r border-slate-100 dark:border-slate-800
                        transition-all duration-150 group
                        ${isLastRow ? 'border-b-0' : ''}
                        ${isLastCol ? 'border-r-0' : ''}
                        ${!day.inMonth
                          ? 'bg-slate-50/40 dark:bg-slate-900/40'
                          : day.isWeekend
                            ? 'bg-slate-50/60 dark:bg-slate-800/20'
                            : 'bg-white dark:bg-slate-900'
                        }
                        ${day.inMonth ? 'cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10' : 'pointer-events-none'}
                      `}
                    >
                      {/* Day Number */}
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className={`
                            inline-flex items-center justify-center text-sm font-medium
                            ${day.today
                              ? 'w-7 h-7 rounded-full bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-200 dark:shadow-indigo-900'
                              : day.inMonth
                                ? 'text-slate-700 dark:text-slate-300'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          `}
                        >
                          {format(day.date, 'd')}
                        </span>
                        {day.inMonth && day.totalHours > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.totalHours.toFixed(1)}h
                          </span>
                        )}
                      </div>

                      {/* Entries */}
                      {day.inMonth && (
                        <div className="space-y-0.5 overflow-hidden">
                          {day.entries.slice(0, 3).map((entry, eIdx) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] lg:text-[11px] font-medium truncate transition-transform group-hover:scale-[1.02]"
                              style={{
                                backgroundColor: `${getProjectColor(entry.planningColor, eIdx)}15`,
                                color: getProjectColor(entry.planningColor, eIdx),
                                borderLeft: `2px solid ${getProjectColor(entry.planningColor, eIdx)}`,
                              }}
                            >
                              <span className="truncate">{entry.projectName}</span>
                              <span className="ml-auto font-bold whitespace-nowrap">
                                {entry.hours.toFixed(1)}
                              </span>
                            </div>
                          ))}
                          {day.entries.length > 3 && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-1.5">
                              +{day.entries.length - 3} more
                            </div>
                          )}

                          {/* Leave Requests */}
                          {day.leaveRequests.map(leave => (
                            <div
                              key={leave.id}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] lg:text-[11px] font-medium truncate"
                              style={{
                                backgroundColor: `${leave.leaveTypeColor}20`,
                                color: leave.leaveTypeColor,
                                borderLeft: `2px solid ${leave.leaveTypeColor}`,
                              }}
                            >
                              <Palmtree className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{leave.leaveTypeName}</span>
                              {leave.isHalfDay && (
                                <span className="text-[9px] opacity-75">1/2</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Hours Total */}
                      {day.inMonth && day.isWorkingDay && day.totalHours > 0 && (
                        <div className="absolute bottom-1 right-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              day.totalHours >= day.scheduledHours && day.scheduledHours > 0
                                ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {day.totalHours.toFixed(1)}h
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-300" />
          <span>Hours met</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Palmtree className="w-3 h-3 text-amber-500" />
          <span>Leave</span>
        </div>
        <div className="ml-auto text-slate-400 dark:text-slate-500">
          Click any day to add an entry
        </div>
      </div>
    </div>
  );
}
