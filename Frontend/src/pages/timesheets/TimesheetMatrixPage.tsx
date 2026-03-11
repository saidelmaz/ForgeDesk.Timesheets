import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { timesheetsApi } from '@/api/timesheets';
import { useTimesheetStore } from '@/stores/timesheetStore';
import type { TimesheetMatrixResponse, MatrixCellUpdate } from '@/types';
import { ChevronLeft, ChevronRight, CalendarDays, Save } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export function TimesheetMatrixPage() {
  const { selectedWeekStart, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useTimesheetStore();
  const [matrix, setMatrix] = useState<TimesheetMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCells, setEditedCells] = useState<Map<string, MatrixCellUpdate>>(new Map());

  const fetchMatrix = useCallback(() => {
    setLoading(true);
    timesheetsApi.getMatrix(selectedWeekStart)
      .then(res => { setMatrix(res.data); setEditedCells(new Map()); })
      .catch(() => toast.error('Failed to load timesheet'))
      .finally(() => setLoading(false));
  }, [selectedWeekStart]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(parseISO(selectedWeekStart), i);
    return { date: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE'), dayNum: format(date, 'dd') };
  });

  const handleCellChange = (projectId: string, taskId: string | undefined, date: string, value: string) => {
    const hours = parseFloat(value) || 0;
    const key = `${projectId}-${taskId || ''}-${date}`;
    setEditedCells(prev => {
      const next = new Map(prev);
      next.set(key, { projectId, taskId, date, hours });
      return next;
    });
  };

  const getCellValue = (projectId: string, taskId: string | undefined, date: string, originalHours: number): string => {
    const key = `${projectId}-${taskId || ''}-${date}`;
    const edited = editedCells.get(key);
    if (edited !== undefined) return edited.hours === 0 ? '' : edited.hours.toString();
    return originalHours === 0 ? '' : originalHours.toString();
  };

  const handleSave = async () => {
    if (editedCells.size === 0) return;
    setSaving(true);
    try {
      await timesheetsApi.saveMatrix({ weekStart: selectedWeekStart, cells: Array.from(editedCells.values()) });
      toast.success('Timesheet saved');
      fetchMatrix();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const weekTotal = matrix?.weekTotal || 0;
  const scheduledHours = matrix?.scheduleHours?.reduce((a, b) => a + b, 0) || 40;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timesheet</h1>
          <p className="text-slate-500 text-sm mt-0.5">Week of {format(parseISO(selectedWeekStart), 'MMMM dd, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="rounded-r-none border-r border-slate-200 dark:border-slate-700"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="rounded-none px-3"><CalendarDays className="w-4 h-4 mr-1.5" />Today</Button>
            <Button variant="ghost" size="sm" onClick={goToNextWeek} className="rounded-l-none border-l border-slate-200 dark:border-slate-700"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900 dark:text-white text-base">{weekTotal.toFixed(1)}h</span> <span className="text-slate-400">/ {scheduledHours}h</span></span>
            <Badge variant={weekTotal >= scheduledHours ? 'success' : weekTotal > 0 ? 'warning' : 'default'}>
              {weekTotal >= scheduledHours ? 'Complete' : `${((weekTotal / scheduledHours) * 100).toFixed(0)}%`}
            </Badge>
          </div>
          <Button onClick={handleSave} isLoading={saving} disabled={editedCells.size === 0}>
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">Project / Task</th>
                  {weekDays.map(d => (
                    <th key={d.date} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                      <div className="text-slate-400">{d.label}</div><div className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">{d.dayNum}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {matrix?.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{row.projectName}</div>
                      {row.taskName && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.taskName}</div>}
                    </td>
                    {weekDays.map((d, dayIdx) => (
                      <td key={d.date} className="px-1.5 py-2">
                        <input
                          type="number" step="0.25" min="0" max="24"
                          className="w-full text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={getCellValue(row.projectId, row.taskId, d.date, row.dailyHours?.[dayIdx] || 0)}
                          onChange={e => handleCellChange(row.projectId, row.taskId, d.date, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-slate-900 dark:text-white">{(row.totalHours ?? 0).toFixed(1)}</td>
                  </tr>
                ))}
                {(!matrix?.rows || matrix.rows.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No projects assigned. Create a project to start tracking time.</td></tr>
                )}
              </tbody>
              {matrix?.rows && matrix.rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">Daily Totals</td>
                    {weekDays.map((d, dayIdx) => (
                      <td key={d.date} className="px-2 py-3 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                        {(matrix?.dailyTotals?.[dayIdx] || 0).toFixed(1)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">{weekTotal.toFixed(1)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
