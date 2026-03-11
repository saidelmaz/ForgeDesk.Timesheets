import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { projectsApi } from '@/api/projects';
import { integrationApi } from '@/api/integration';
import { ProjectStatus, type FDCompany } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<FDCompany[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', customerId: '', customerName: '',
    status: 'Active', baselineHours: '0', plannedHours: '0', planningColor: '#4f46e5',
  });

  useEffect(() => {
    integrationApi.getCompanies().then(res => setCompanies(res.data)).catch(() => {});
    if (id) {
      projectsApi.get(id).then(res => {
        const p = res.data;
        setForm({
          name: p.name, description: p.description || '', customerId: p.customerId || '',
          customerName: p.customerName || '', status: p.status,
          baselineHours: p.baselineHours?.toString() || '0',
          plannedHours: p.plannedHours?.toString() || '0',
          planningColor: p.planningColor || '#4f46e5',
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedCompany = companies.find(c => c.id === form.customerId);
      const data = { ...form, status: form.status as ProjectStatus, customerName: selectedCompany?.name || form.customerName, baselineHours: parseFloat(form.baselineHours) || 0, plannedHours: parseFloat(form.plannedHours) || 0 };
      if (isEdit && id) await projectsApi.update(id, data);
      else await projectsApi.create(data);
      toast.success(isEdit ? 'Project updated' : 'Project created');
      navigate('/projects');
    } catch { toast.error('Failed to save project'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <Card>
        <CardHeader><h1 className="text-xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Project' : 'New Project'}</h1></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <Input label="Project Name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} />
            <Select label="Customer" value={form.customerId} onChange={e => setForm(p => ({...p, customerId: e.target.value}))}
              options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select a customer (optional)" />
            <Select label="Status" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}
              options={[{ value: 'Active', label: 'Active' }, { value: 'OnHold', label: 'On Hold' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Baseline Hours" type="number" min="0" value={form.baselineHours} onChange={e => setForm(p => ({...p, baselineHours: e.target.value}))} />
              <Input label="Planned Hours" type="number" min="0" value={form.plannedHours} onChange={e => setForm(p => ({...p, plannedHours: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Planning Color</label>
              <input type="color" value={form.planningColor} onChange={e => setForm(p => ({...p, planningColor: e.target.value}))} className="h-10 w-20 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600" />
            </div>
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
