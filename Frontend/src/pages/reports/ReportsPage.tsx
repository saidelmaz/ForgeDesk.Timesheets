import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { reportsApi } from '@/api/reports';
import type { ReportSummary } from '@/types';
import {
  Clock,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Download,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
} from 'date-fns';
import toast from 'react-hot-toast';

const DEFAULT_PROJECT_COLORS = [
  '#4f46e5', '#0d9488', '#d97706', '#e11d48', '#7c3aed',
  '#0891b2', '#059669', '#dc2626', '#2563eb', '#c026d3',
];

function getProjectColor(color?: string, index: number = 0): string {
  return color || DEFAULT_PROJECT_COLORS[index % DEFAULT_PROJECT_COLORS.length];
}

type Preset = 'thisWeek' | 'thisMonth' | 'lastMonth';

function getPresetDates(preset: Preset) {
  const now = new Date();
  switch (preset) {
    case 'thisWeek':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'thisMonth':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return {
        from: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        to: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    }
  }
}

export function ReportsPage() {
  const [activePreset, setActivePreset] = useState<Preset>('thisMonth');
  const [dateFrom, setDateFrom] = useState(
    () => getPresetDates('thisMonth').from,
  );
  const [dateTo, setDateTo] = useState(
    () => getPresetDates('thisMonth').to,
  );
  const [exporting, setExporting] = useState(false);

  const {
    data: report,
    isLoading,
  } = useQuery({
    queryKey: ['reports-summary', dateFrom, dateTo],
    queryFn: () =>
      reportsApi.getSummary(dateFrom, dateTo).then(res => res.data),
    enabled: !!dateFrom && !!dateTo,
  });

  const handlePreset = (preset: Preset) => {
    setActivePreset(preset);
    const dates = getPresetDates(preset);
    setDateFrom(dates.from);
    setDateTo(dates.to);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const response = await reportsApi.exportCsv(dateFrom, dateTo);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet-report-${dateFrom}-to-${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Find max hours in daily breakdown for scaling bars
  const maxDailyHours = useMemo(() => {
    if (!report?.dailyBreakdown) return 8;
    const maxActual = Math.max(
      ...report.dailyBreakdown.map(d => d.totalHours),
      0,
    );
    const maxScheduled = Math.max(
      ...report.dailyBreakdown.map(d => d.scheduledHours),
      0,
    );
    return Math.max(maxActual, maxScheduled, 1);
  }, [report]);

  // Find max project hours for bar scaling
  const maxProjectHours = useMemo(() => {
    if (!report?.projectBreakdown) return 1;
    return Math.max(...report.projectBreakdown.map(p => p.totalHours), 1);
  }, [report]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reports
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Time tracking analytics and exports
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          isLoading={exporting}
          disabled={!report}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Preset buttons */}
            <div className="flex items-center gap-1.5">
              {([
                { key: 'thisWeek', label: 'This Week' },
                { key: 'thisMonth', label: 'This Month' },
                { key: 'lastMonth', label: 'Last Month' },
              ] as const).map(preset => (
                <Button
                  key={preset.key}
                  variant={activePreset === preset.key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handlePreset(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Date inputs */}
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => {
                    setDateFrom(e.target.value);
                    setActivePreset(null as unknown as Preset);
                  }}
                  className="block rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-5" />
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => {
                    setDateTo(e.target.value);
                    setActivePreset(null as unknown as Preset);
                  }}
                  className="block rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Total Hours
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {report.totalHours.toFixed(1)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20">
                  <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Scheduled
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {report.scheduledHours.toFixed(0)}h
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Overtime
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {report.overtimeHours.toFixed(1)}h
                  </p>
                  {report.overtimeHours > 0 && (
                    <Badge variant="warning" className="mt-1">
                      +{((report.overtimeHours / (report.scheduledHours || 1)) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    Utilization
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {report.utilizationPercent.toFixed(0)}%
                  </p>
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(report.utilizationPercent, 100)}%`,
                        backgroundColor:
                          report.utilizationPercent >= 100
                            ? '#0d9488'
                            : report.utilizationPercent >= 75
                              ? '#4f46e5'
                              : '#d97706',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Project Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Project Breakdown
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.projectBreakdown.length > 0 ? (
                  report.projectBreakdown.map((project, idx) => {
                    const color = getProjectColor(project.planningColor, idx);
                    const barPercent =
                      maxProjectHours > 0
                        ? (project.totalHours / maxProjectHours) * 100
                        : 0;

                    return (
                      <div key={project.projectId} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              {project.projectName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {project.totalHours.toFixed(1)}h
                            </span>
                            <Badge variant="default" className="text-[10px]">
                              {project.percentOfTotal.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${barPercent}%`,
                              backgroundColor: color,
                            }}
                          />
                          {project.plannedHours > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-900/30 dark:bg-white/30"
                              style={{
                                left: `${Math.min((project.plannedHours / maxProjectHours) * 100, 100)}%`,
                              }}
                              title={`Planned: ${project.plannedHours}h`}
                            />
                          )}
                        </div>

                        {project.plannedHours > 0 && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>
                              Planned: {project.plannedHours.toFixed(1)}h
                            </span>
                            <span>
                              {project.totalHours >= project.plannedHours
                                ? `+${(project.totalHours - project.plannedHours).toFixed(1)}h over`
                                : `${(project.plannedHours - project.totalHours).toFixed(1)}h under`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    No project data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Breakdown */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Daily Breakdown
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {report.dailyBreakdown.length > 0 ? (
                  <div className="flex items-end gap-1 h-52">
                    {report.dailyBreakdown.map((day, idx) => {
                      const barHeight =
                        maxDailyHours > 0
                          ? (day.totalHours / maxDailyHours) * 100
                          : 0;
                      const scheduledLine =
                        maxDailyHours > 0
                          ? (day.scheduledHours / maxDailyHours) * 100
                          : 0;
                      const isWeekend = (() => {
                        try {
                          const d = parseISO(day.date);
                          const dow = d.getDay();
                          return dow === 0 || dow === 6;
                        } catch {
                          return false;
                        }
                      })();

                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {day.totalHours.toFixed(1)}h / {day.scheduledHours}h
                          </div>

                          {/* Bar container */}
                          <div className="w-full h-full flex items-end relative">
                            {/* Scheduled line */}
                            {day.scheduledHours > 0 && (
                              <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300 dark:border-slate-600 pointer-events-none"
                                style={{ bottom: `${scheduledLine}%` }}
                              />
                            )}

                            {/* Actual bar */}
                            <div
                              className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                                isWeekend
                                  ? 'bg-slate-200 dark:bg-slate-700'
                                  : day.totalHours >= day.scheduledHours && day.scheduledHours > 0
                                    ? 'bg-teal-400 dark:bg-teal-500'
                                    : day.totalHours > 0
                                      ? 'bg-indigo-400 dark:bg-indigo-500'
                                      : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                              style={{
                                height: `${Math.max(barHeight, day.totalHours > 0 ? 4 : 1)}%`,
                              }}
                            />
                          </div>

                          {/* Day label */}
                          <span
                            className={`text-[9px] lg:text-[10px] font-medium truncate w-full text-center ${
                              isWeekend
                                ? 'text-slate-300 dark:text-slate-600'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {(() => {
                              try {
                                return format(parseISO(day.date), 'dd');
                              } catch {
                                return '';
                              }
                            })()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    No daily data for this period
                  </div>
                )}

                {/* Legend */}
                {report.dailyBreakdown.length > 0 && (
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-indigo-400 dark:bg-indigo-500" />
                      <span>Hours logged</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-400 dark:bg-teal-500" />
                      <span>Target met</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
                      <span>Scheduled</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Select a date range to view your report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
