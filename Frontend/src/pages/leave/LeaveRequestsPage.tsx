import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { leaveApi } from '@/api/leave';
import type { LeaveRequest } from '@/types';
import { Plus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusVariant = (s: string) => {
  switch (s) { case 'Approved': return 'success'; case 'Pending': return 'warning'; case 'Rejected': return 'danger'; case 'Cancelled': return 'default'; default: return 'info'; }
};

export function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const fetchRequests = () => {
    setLoading(true);
    leaveApi.getRequests(filter ? { status: filter } : undefined)
      .then(res => { setRequests(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleCancel = async (id: string) => {
    try {
      await leaveApi.cancelRequest(id);
      toast.success('Request cancelled');
      fetchRequests();
    } catch { toast.error('Failed to cancel'); }
  };

  const filters = ['', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/leave')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Requests</h1>
            <p className="text-slate-500 text-sm mt-0.5">All your leave requests</p>
          </div>
        </div>
        <Button onClick={() => navigate('/leave/request/new')}><Plus className="w-4 h-4 mr-2" />New Request</Button>
      </div>

      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : requests.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: req.leaveTypeColor || '#4f46e5' }} />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{req.leaveTypeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                      {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-right font-semibold text-slate-900 dark:text-white">{req.totalDays}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">{req.reason || '-'}</td>
                    <td className="px-6 py-3.5"><Badge variant={statusVariant(req.status)}>{req.status}</Badge></td>
                    <td className="px-6 py-3.5 text-right">
                      {(req.status === 'Pending' || req.status === 'Approved') && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(req.id)} className="text-rose-600 hover:text-rose-700">Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No leave requests found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
