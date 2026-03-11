import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { timesheetsApi } from '@/api/timesheets';
import type { TimesheetEntry } from '@/types';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusVariant = (s: string) => {
  switch(s) { case 'Approved': return 'success'; case 'Submitted': return 'info'; case 'Rejected': return 'danger'; default: return 'default'; }
};

export function TimesheetListPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    timesheetsApi.getEntries().then(res => { setEntries(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e =>
    (e.projectName || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.taskName || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.userDisplayName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Entries</h1>
          <p className="text-slate-500 text-sm mt-0.5">All timesheet entries</p>
        </div>
        <Button onClick={() => navigate('/entries/new')}><Plus className="w-4 h-4 mr-2" />Add Entry</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : filtered.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => navigate(`/entries/${e.id}`)}>
                    <td className="px-6 py-3.5 text-sm text-slate-700 dark:text-slate-300">{format(new Date(e.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-200">{e.projectName || '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">{e.taskName || '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-right font-semibold text-slate-900 dark:text-white">{e.hours.toFixed(1)}</td>
                    <td className="px-6 py-3.5"><Badge variant={statusVariant(e.status)}>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No entries found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
