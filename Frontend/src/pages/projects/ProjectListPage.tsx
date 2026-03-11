import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { projectsApi } from '@/api/projects';
import type { Project } from '@/types';
import { Plus, Search, FolderKanban } from 'lucide-react';

const statusVariant = (s: string) => {
  switch(s) { case 'Active': return 'success'; case 'OnHold': return 'warning'; case 'Completed': return 'info'; case 'Cancelled': return 'danger'; default: return 'default'; }
};

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi.getAll().then(res => { setProjects(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.customerName || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your projects and tasks</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : filtered.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actual</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td className="px-6 py-3.5"><div className="flex items-center gap-2.5"><FolderKanban className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</span></div></td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.customerName || '-'}</td>
                    <td className="px-6 py-3.5"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                    <td className="px-6 py-3.5 text-sm text-right font-medium text-slate-900 dark:text-white">{p.actualHours?.toFixed(1)}h</td>
                    <td className="px-6 py-3.5 text-sm text-right text-slate-500">{p.plannedHours?.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No projects found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
