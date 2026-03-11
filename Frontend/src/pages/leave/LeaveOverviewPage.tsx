import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { leaveApi } from '@/api/leave';
import type { LeaveOverview } from '@/types';
import { Plus, CalendarOff, CalendarCheck, Clock3 } from 'lucide-react';
import { format } from 'date-fns';

const statusVariant = (s: string) => {
  switch (s) { case 'Approved': return 'success'; case 'Pending': return 'warning'; case 'Rejected': return 'danger'; case 'Cancelled': return 'default'; default: return 'info'; }
};

export function LeaveOverviewPage() {
  const [data, setData] = useState<LeaveOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    leaveApi.getOverview()
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your time off</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/leave/requests')}>View All Requests</Button>
          <Button onClick={() => navigate('/leave/request/new')}><Plus className="w-4 h-4 mr-2" />Request Leave</Button>
        </div>
      </div>

      {/* Leave Balances */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Leave Balances ({new Date().getFullYear()})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.balances?.map(balance => {
            const usedPct = balance.totalDays > 0 ? Math.min((balance.usedDays / balance.totalDays) * 100, 100) : 0;
            return (
              <Card key={balance.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: balance.leaveTypeColor || '#4f46e5' }} />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{balance.leaveTypeName}</span>
                    </div>
                    {balance.pendingDays > 0 && (
                      <Badge variant="warning">{balance.pendingDays}d pending</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{balance.remainingDays}</span>
                    <span className="text-sm text-slate-500">/ {balance.totalDays} days</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${usedPct}%`, backgroundColor: balance.leaveTypeColor || '#4f46e5' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>{balance.usedDays}d used</span>
                    <span>{balance.remainingDays}d remaining</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(!data?.balances || data.balances.length === 0) && (
            <div className="col-span-full text-center py-8 text-slate-500">No leave balances found.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock3 className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Pending Requests</h2>
          </CardHeader>
          <CardContent className="p-0">
            {data?.pendingRequests?.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.pendingRequests.map(req => (
                  <div key={req.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: req.leaveTypeColor || '#4f46e5' }} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{req.leaveTypeName}</p>
                        <p className="text-xs text-slate-500">{format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">{req.totalDays}d</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No pending requests</div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Leave */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-teal-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Leave</h2>
          </CardHeader>
          <CardContent className="p-0">
            {data?.upcomingLeave?.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.upcomingLeave.map(req => (
                  <div key={req.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: req.leaveTypeColor || '#4f46e5' }} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{req.leaveTypeName}</p>
                        <p className="text-xs text-slate-500">{format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <Badge variant="success">{req.totalDays}d</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No upcoming leave</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
