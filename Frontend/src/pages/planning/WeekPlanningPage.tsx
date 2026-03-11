import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { timesheetsApi } from '@/api/timesheets';
import { leaveApi } from '@/api/leave';
import { useTimesheetStore } from '@/stores/timesheetStore';
import type { LeaveRequest } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  Palmtree,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { format, addDays, parseISO, isWithinInterval } from 'date-fns';

const DEFAULT_PROJECT_COLORS = [
  '#4f46e5', '#0d9488', '#d97706', '#e11d48', '#7c3aed',
  '#0891b2', '#059669', '#dc2626', '#2563eb', '#c026d3',
];

function getProjectColor(color?: string, index: number = 0): string {
  return color || DEFAULT_PROJECT_COLORS[index % DEFAULT_PROJECT_COLORS.length];
}

const DEFAULT_DAILY_HOURS = 8;

export function WeekPlanningPage() {
  const { selectedWeekStart, goToPreviousWeek, goToNextWeek, goToCurrentWeek } =
    useTimesheetStore();

  const {
    data: matrix,
    isLoading: matrixLoading,
  } = useQuery({
    queryKey: ['planning-matrix', selectedWeekStart],
    queryFn: () =>
      timesheetsApi.getMatrix(selectedWeekStart).then(res => res.data),
  });

  const { data: leaveRequests } = useQuery({
    queryKey: ['planning-leaves', selectedWeekStart],
    queryFn: () =>
      leaveApi.getRequests({ status: 'Approved' }).then(res => res.data),
  });

  const weekDays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const date = addDays(parseISO(selectedWeekStart), i);
        return {
          index: i,
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEE'),
          dayNum: format(date, 'dd'),
          fullLabel: format(date, 'MMM dd'),
        };
      }),
    [selectedWeekStart],
  );

  // Find leave for each day
  const leaveDays = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    if (!leaveRequests) return map;
    for (const day of weekDays) {
      const dayLeaves = leaveRequests.filter(lr => {
        try {
          return isWithinInterval(day.date, {
            start: parseISO(lr.startDate),
            end: parseISO(lr.endDate),
          });
        } catch {
          return false;
        }
      });
      if (dayLeaves.length > 0) map.set(day.dateStr, dayLeaves);
    }
    return map;
  }, [leaveRequests, weekDays]);

  // Calculate daily capacity data
  const dailyCapacity = useMemo(() => {
    return weekDays.map(day => {
      const dailyTotal = matrix?.dailyTotals?.[day.index] || 0;
      const scheduledForDay = matrix?.scheduleHours?.[day.index] || DEFAULT_DAILY_HOURS;
      const hasLeave = leaveDays.has(day.dateStr);
      const effectiveScheduled = hasLeave ? scheduledForDay / 2 : scheduledForDay;
      const percent = effectiveScheduled > 0 ? Math.round((dailyTotal / effectiveScheduled) * 100) : 0;
      return {
        ...day,
        actual: dailyTotal,
        scheduled: effectiveScheduled,
        percent,
        hasLeave,
        leaves: leaveDays.get(day.dateStr) || [],
      };
    });
  }, [weekDays, matrix, leaveDays]);

  const weekTotal = matrix?.weekTotal || 0;
  const scheduledTotal = matrix?.scheduleHours?.reduce((a, b) => a + b, 0) || 40;
  const weekPercent = scheduledTotal > 0 ? Math.round((weekTotal / scheduledTotal) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Week Planning
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Week of {format(parseISO(selectedWeekStart), 'MMMM dd, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousWeek}
              className="rounded-r-none border-r border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentWeek}
              className="rounded-none px-3"
            >
              <CalendarDays className="w-4 h-4 mr-1.5" />
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextWeek}
              className="rounded-l-none border-l border-slate-200 dark:border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Capacity Indicators */}
      <div className="grid grid-cols-5 gap-3">
        {dailyCapacity.map(day => {
          const barColor =
            day.percent >= 100
              ? 'bg-teal-500'
              : day.percent >= 75
                ? 'bg-indigo-500'
                : day.percent > 0
                  ? 'bg-amber-500'
                  : 'bg-slate-200 dark:bg-slate-700';

          return (
            <Card
              key={day.dateStr}
              className={`hover:shadow-md transition-shadow ${day.hasLeave ? 'ring-1 ring-amber-200 dark:ring-amber-800' : ''}`}
            >
              <CardContent className="py-3 px-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">
                      {day.label}
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {day.dayNum}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {day.actual.toFixed(1)}h
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      / {day.scheduled.toFixed(0)}h
                    </div>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(day.percent, 100)}%` }}
                  />
                </div>

                {/* Leave indicator */}
                {day.hasLeave && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <Palmtree className="w-3 h-3" />
                    {day.leaves.map(l => l.leaveTypeName).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Week Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Resource Allocation
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Total:{' '}
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {weekTotal.toFixed(1)}h
              </span>{' '}
              <span className="text-slate-400">/ {scheduledTotal}h</span>
            </span>
            <Badge
              variant={
                weekPercent >= 100 ? 'success' : weekPercent >= 75 ? 'info' : weekPercent > 0 ? 'warning' : 'default'
              }
            >
              {weekPercent}%
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Planning Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {matrixLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : matrix?.rows && matrix.rows.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">
                    Project / Task
                  </th>
                  {weekDays.map(d => (
                    <th
                      key={d.dateStr}
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="text-slate-400">{d.label}</div>
                      <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {d.dayNum}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {matrix.rows.map((row, rowIdx) => {
                  const projectColor = getProjectColor(undefined, rowIdx);
                  const rowTotal = row.totalHours ?? 0;
                  return (
                    <tr
                      key={`${row.projectId}-${row.taskId || ''}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Project/Task Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: projectColor }}
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {row.projectName}
                            </div>
                            {row.taskName && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {row.taskName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {weekDays.map(d => {
                        const cellHours = row.dailyHours?.[d.index] || 0;
                        const hasLeave = leaveDays.has(d.dateStr);
                        const scheduledForDay = matrix?.scheduleHours?.[d.index] || DEFAULT_DAILY_HOURS;
                        const barWidth =
                          scheduledForDay > 0
                            ? Math.min((cellHours / scheduledForDay) * 100, 100)
                            : 0;

                        return (
                          <td
                            key={d.dateStr}
                            className={`px-2 py-2.5 ${hasLeave ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {/* Hours value */}
                              <span
                                className={`text-sm font-semibold ${
                                  cellHours > 0
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              >
                                {cellHours > 0 ? cellHours.toFixed(1) : '-'}
                              </span>

                              {/* Hours bar */}
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${barWidth}%`,
                                    backgroundColor: projectColor,
                                    opacity: cellHours > 0 ? 1 : 0,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {rowTotal.toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer: Daily Totals */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Daily Totals
                  </td>
                  {weekDays.map(d => {
                    const dailyTotal = matrix.dailyTotals?.[d.index] || 0;
                    const scheduledForDay = matrix.scheduleHours?.[d.index] || DEFAULT_DAILY_HOURS;
                    const dailyPercent =
                      scheduledForDay > 0
                        ? Math.round((dailyTotal / scheduledForDay) * 100)
                        : 0;

                    return (
                      <td key={d.dateStr} className="px-2 py-3 text-center">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {dailyTotal.toFixed(1)}
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            dailyPercent >= 100
                              ? 'text-teal-600 dark:text-teal-400'
                              : dailyPercent >= 75
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {dailyPercent}%
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {weekTotal.toFixed(1)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">No project allocations for this week</p>
              <p className="text-xs mt-1">
                Create a project and add timesheet entries to see your planning view.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Hours Summary (Stacked Bars) */}
      {matrix?.rows && matrix.rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Project Hours Distribution
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {matrix.rows.map((row, idx) => {
              const projectColor = getProjectColor(undefined, idx);
              const rowTotal = row.totalHours ?? 0;
              const percentOfTotal =
                weekTotal > 0
                  ? Math.round((rowTotal / weekTotal) * 100)
                  : 0;

              return (
                <div key={`${row.projectId}-${row.taskId || ''}`} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: projectColor }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.projectName}
                        {row.taskName && (
                          <span className="text-slate-400 dark:text-slate-500">
                            {' / '}{row.taskName}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {rowTotal.toFixed(1)}h
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right">
                        {percentOfTotal}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentOfTotal}%`,
                        backgroundColor: projectColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
