import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { projectsApi } from '@/api/projects';
import type { Project, ProjectTask } from '@/types';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([projectsApi.get(id), projectsApi.getTasks(id)])
      .then(([pRes, tRes]) => { setProject(pRes.data); setTasks(tRes.data); })
      .catch(() => toast.error('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  if (!project) return <div className="text-center py-12 text-slate-500">Project not found.</div>;

  const statusVariant = (s: string) => {
    switch(s) { case 'Active': return 'success' as const; case 'OnHold': return 'warning' as const; case 'Completed': return 'info' as const; default: return 'default' as const; }
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={() => navigate('/projects')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Projects</Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.customerName || 'No customer'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/edit`)}><Edit2 className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-[13px] font-medium text-slate-500">Actual Hours</p><p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{project.actualHours?.toFixed(1)}h</p></div>
            <div><p className="text-[13px] font-medium text-slate-500">Planned Hours</p><p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{project.plannedHours?.toFixed(1)}h</p></div>
            <div><p className="text-[13px] font-medium text-slate-500">Baseline</p><p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{project.baselineHours?.toFixed(1)}h</p></div>
            <div><p className="text-[13px] font-medium text-slate-500">Manager</p><p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{project.managerName || '-'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tasks ({tasks.length})</h2>
          <Button size="sm" onClick={() => toast('Task creation coming soon')}><Plus className="w-4 h-4 mr-2" />Add Task</Button>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actual</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900 dark:text-white">{t.name}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-slate-900 dark:text-white">{t.actualHours?.toFixed(1)}h</td>
                    <td className="px-6 py-3.5 text-sm text-right text-slate-500">{t.plannedHours?.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-10 text-center text-slate-500">No tasks yet. Add tasks to track time at a finer level.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
