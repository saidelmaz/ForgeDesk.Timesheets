import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardSummary } from '@/types';
import { Clock, FolderKanban, Calendar, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.getSummary().then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  const weekProgress = data ? Math.min((data.weekHours / (data.weekScheduledHours || 40)) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your timesheet overview</p>
        </div>
        <Button onClick={() => navigate('/entries/new')}><Plus className="w-4 h-4 mr-2" />Add Entry</Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20"><Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.todayHours?.toFixed(1) || '0.0'}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20"><TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">This Week</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.weekHours?.toFixed(1) || '0.0'}h</p>
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${weekProgress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20"><Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Scheduled</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.weekScheduledHours?.toFixed(0) || '40'}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"><FolderKanban className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.activeProjectCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all" onClick={() => navigate('/timesheet')}>
          <CardContent className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div><p className="font-semibold text-slate-900 dark:text-white text-[15px]">Open Timesheet Matrix</p><p className="text-sm text-slate-500 mt-0.5">Enter hours for the current week</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all" onClick={() => navigate('/projects')}>
          <CardContent className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-violet-600" />
            <div><p className="font-semibold text-slate-900 dark:text-white text-[15px]">Manage Projects</p><p className="text-sm text-slate-500 mt-0.5">View and edit your projects</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader><h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Entries</h2></CardHeader>
        <CardContent className="p-0">
          {data?.recentEntries?.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-slate-700 dark:text-slate-300">{format(new Date(entry.date), 'MMM dd')}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-200">{entry.projectName}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">{entry.taskName || '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-right font-semibold text-slate-900 dark:text-white">{entry.hours.toFixed(1)}</td>
                    <td className="px-6 py-3.5"><Badge variant={entry.status === 'Approved' ? 'success' : entry.status === 'Submitted' ? 'info' : 'default'}>{entry.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No recent entries. Start tracking your time!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
