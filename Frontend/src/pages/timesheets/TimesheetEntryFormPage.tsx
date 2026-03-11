import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { timesheetsApi } from '@/api/timesheets';
import { projectsApi } from '@/api/projects';
import type { Project, ProjectTask } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function TimesheetEntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  const [form, setForm] = useState({
    projectId: '', taskId: '', date: format(new Date(), 'yyyy-MM-dd'),
    hours: '0', startTime: '', endTime: '', breakMinutes: '0', notes: '',
  });

  useEffect(() => {
    projectsApi.getAll().then(res => setProjects(res.data)).catch(() => {});
    if (id) {
      setLoading(true);
      timesheetsApi.getEntry(id).then(res => {
        const e = res.data;
        setForm({
          projectId: e.projectId || '', taskId: e.taskId || '',
          date: e.date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
          hours: e.hours?.toString() || '0', startTime: e.startTime || '',
          endTime: e.endTime || '', breakMinutes: e.breakMinutes?.toString() || '0',
          notes: e.notes || '',
        });
        if (e.projectId) projectsApi.getTasks(e.projectId).then(r => setTasks(r.data)).catch(() => {});
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (form.projectId) {
      projectsApi.getTasks(form.projectId).then(res => setTasks(res.data)).catch(() => setTasks([]));
    } else { setTasks([]); }
  }, [form.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, hours: parseFloat(form.hours) || 0, breakMinutes: parseInt(form.breakMinutes) || 0, taskId: form.taskId || undefined };
      if (isEdit && id) await timesheetsApi.updateEntry(id, data);
      else await timesheetsApi.createEntry(data);
      toast.success(isEdit ? 'Entry updated' : 'Entry created');
      navigate('/entries');
    } catch { toast.error('Failed to save entry'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <Card>
        <CardHeader><h1 className="text-xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Entry' : 'New Entry'}</h1></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <Select label="Project" value={form.projectId} onChange={e => setForm(p => ({...p, projectId: e.target.value, taskId: ''}))}
              options={projects.map(p => ({ value: p.id, label: p.name }))} placeholder="Select a project" required />
            {tasks.length > 0 && (
              <Select label="Task" value={form.taskId} onChange={e => setForm(p => ({...p, taskId: e.target.value}))}
                options={tasks.map(t => ({ value: t.id, label: t.name }))} placeholder="Select a task (optional)" />
            )}
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} required />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Hours" type="number" step="0.25" min="0" max="24" value={form.hours} onChange={e => setForm(p => ({...p, hours: e.target.value}))} required />
              <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm(p => ({...p, startTime: e.target.value}))} />
              <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm(p => ({...p, endTime: e.target.value}))} />
            </div>
            <Input label="Break (minutes)" type="number" min="0" value={form.breakMinutes} onChange={e => setForm(p => ({...p, breakMinutes: e.target.value}))} />
            <Textarea label="Notes" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Save className="w-4 h-4 mr-2" />{isEdit ? 'Update' : 'Create'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
