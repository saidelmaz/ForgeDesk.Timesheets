import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { leaveApi } from '@/api/leave';
import type { LeaveRequest } from '@/types';
import { ArrowLeft, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [selectedId, setSelectedId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const fetchPending = () => {
    setLoading(true);
    leaveApi.getPendingApprovals()
      .then(res => { setRequests(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const openModal = (id: string, action: 'approve' | 'reject') => {
    setSelectedId(id);
    setModalAction(action);
    setNotes('');
    setModalOpen(true);
  };

  const handleAction = async () => {
    setProcessing(true);
    try {
      if (modalAction === 'approve') {
        await leaveApi.approveRequest(selectedId, notes || undefined);
        toast.success('Leave approved');
      } else {
        await leaveApi.rejectRequest(selectedId, notes || undefined);
        toast.success('Leave rejected');
      }
      setModalOpen(false);
      fetchPending();
    } catch { toast.error(`Failed to ${modalAction}`); }
    finally { setProcessing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/leave')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Approvals</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and approve leave requests</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
          ) : requests.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map(req => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold">
                      {req.userDisplayName?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.userDisplayName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: req.leaveTypeColor || '#4f46e5' }} />
                        <span className="text-xs text-slate-500">{req.leaveTypeName}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd')}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{req.totalDays}d</span>
                      </div>
                      {req.reason && <p className="text-xs text-slate-500 mt-1 max-w-md truncate">{req.reason}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openModal(req.id, 'reject')} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                      <X className="w-4 h-4 mr-1" />Reject
                    </Button>
                    <Button size="sm" onClick={() => openModal(req.id, 'approve')}>
                      <Check className="w-4 h-4 mr-1" />Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">No pending requests to review.</div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalAction === 'approve' ? 'Approve Leave' : 'Reject Leave'} size="sm">
        <div className="space-y-4">
          <Textarea
            label={`Notes (optional)`}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder={`Add a note for the ${modalAction === 'approve' ? 'approval' : 'rejection'}...`}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              variant={modalAction === 'approve' ? 'primary' : 'danger'}
              onClick={handleAction}
              isLoading={processing}
            >
              {modalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
