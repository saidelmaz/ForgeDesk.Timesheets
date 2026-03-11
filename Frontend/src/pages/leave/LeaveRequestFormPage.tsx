import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { leaveApi } from '@/api/leave';
import type { LeaveType } from '@/types';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function LeaveRequestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState({
    leaveTypeId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    isHalfDayStart: false,
    isHalfDayEnd: false,
    reason: '',
  });

  useEffect(() => {
    leaveApi.getTypes().then(res => setLeaveTypes(res.data)).catch(() => {});
    if (id) {
      leaveApi.getRequest(id).then(res => {
        const r = res.data;
        setForm({
          leaveTypeId: r.leaveTypeId,
          startDate: r.startDate.split('T')[0],
          endDate: r.endDate.split('T')[0],
          isHalfDayStart: r.isHalfDayStart,
          isHalfDayEnd: r.isHalfDayEnd,
          reason: r.reason || '',
        });
      });
    }
  }, [id]);

  const selectedType = leaveTypes.find(t => t.id === form.leaveTypeId);

  // Calculate estimated days (simple weekday count)
  const estimateDays = () => {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) {
        if ((current.getTime() === start.getTime() && form.isHalfDayStart) ||
            (current.getTime() === end.getTime() && form.isHalfDayEnd))
          days += 0.5;
        else
          days += 1;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId) { toast.error('Select a leave type'); return; }
    setSaving(true);
    try {
      if (isEdit && id) {
        await leaveApi.updateRequest(id, form);
        toast.success('Request updated');
      } else {
        await leaveApi.createRequest(form);
        toast.success('Leave request submitted');
      }
      navigate('/leave');
    } catch { toast.error('Failed to submit request'); }
    finally { setSaving(false); }
  };

  const estDays = estimateDays();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Leave Request' : 'Request Leave'}</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in the details for your leave request</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <Select
              label="Leave Type"
              value={form.leaveTypeId}
              onChange={e => setForm(p => ({ ...p, leaveTypeId: e.target.value }))}
              options={leaveTypes.map(t => ({ value: t.id, label: `${t.name}${t.isPaid ? '' : ' (Unpaid)'}` }))}
              placeholder="Select leave type"
              required
            />

            {selectedType && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedType.color }} />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedType.requiresApproval ? 'Requires approval' : 'Auto-approved'} · {selectedType.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHalfDayStart}
                  onChange={e => setForm(p => ({ ...p, isHalfDayStart: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Half day start</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHalfDayEnd}
                  onChange={e => setForm(p => ({ ...p, isHalfDayEnd: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Half day end</span>
              </label>
            </div>

            {estDays > 0 && (
              <div className="px-3.5 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Estimated: {estDays} working day{estDays !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <Textarea
              label="Reason (optional)"
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              rows={3}
              placeholder="Add a note about your leave request..."
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Send className="w-4 h-4 mr-2" />{isEdit ? 'Update' : 'Submit Request'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
