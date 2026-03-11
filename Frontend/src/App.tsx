import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { TimesheetMatrixPage } from '@/pages/timesheets/TimesheetMatrixPage';
import { TimesheetListPage } from '@/pages/timesheets/TimesheetListPage';
import { TimesheetEntryFormPage } from '@/pages/timesheets/TimesheetEntryFormPage';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { ProjectFormPage } from '@/pages/projects/ProjectFormPage';
import { LeaveOverviewPage } from '@/pages/leave/LeaveOverviewPage';
import { LeaveRequestsPage } from '@/pages/leave/LeaveRequestsPage';
import { LeaveRequestFormPage } from '@/pages/leave/LeaveRequestFormPage';
import { LeaveApprovalsPage } from '@/pages/leave/LeaveApprovalsPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { WeekPlanningPage } from '@/pages/planning/WeekPlanningPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/timesheet" element={<TimesheetMatrixPage />} />
            <Route path="/entries" element={<TimesheetListPage />} />
            <Route path="/entries/new" element={<TimesheetEntryFormPage />} />
            <Route path="/entries/:id" element={<TimesheetEntryFormPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/new" element={<ProjectFormPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
            <Route path="/leave" element={<LeaveOverviewPage />} />
            <Route path="/leave/requests" element={<LeaveRequestsPage />} />
            <Route path="/leave/request/new" element={<LeaveRequestFormPage />} />
            <Route path="/leave/request/:id" element={<LeaveRequestFormPage />} />
            <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planning" element={<WeekPlanningPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#0f172a', color: '#f8fafc', borderRadius: '0.75rem' },
      }} />
    </QueryClientProvider>
  );
}

export default App;
