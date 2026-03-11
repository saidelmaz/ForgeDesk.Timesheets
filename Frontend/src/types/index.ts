export enum ProjectStatus { Active = 'Active', OnHold = 'OnHold', Completed = 'Completed', Cancelled = 'Cancelled' }
export enum TimesheetEntryStatus { Draft = 'Draft', Submitted = 'Submitted', Approved = 'Approved', Rejected = 'Rejected' }
export enum TimesheetPeriodStatus { Open = 'Open', Submitted = 'Submitted', Approved = 'Approved', Rejected = 'Rejected' }

export interface Project {
  id: string; tenantId: string; name: string; description?: string;
  customerId?: string; customerName?: string; managerUserId?: string; managerName?: string;
  status: ProjectStatus; startDate?: string; endDate?: string;
  baselineHours: number; plannedHours: number; actualHours: number;
  planningColor?: string; isActive: boolean; createdAt: string;
}

export interface ProjectTask {
  id: string; tenantId: string; projectId: string; parentTaskId?: string;
  name: string; description?: string; plannedHours: number; baselineHours: number;
  actualHours: number; sortOrder: number; isActive: boolean;
  childTasks?: ProjectTask[];
}

export interface TimesheetEntry {
  id: string; tenantId: string; userId: string; userDisplayName?: string;
  projectId: string; projectName?: string; taskId?: string; taskName?: string;
  ticketId?: string; ticketSubject?: string; applicationId?: string; applicationName?: string;
  categoryId?: string; categoryName?: string;
  date: string; hours: number; startTime?: string; endTime?: string;
  breakMinutes: number; notes?: string; status: TimesheetEntryStatus;
  isDone: boolean; createdAt: string; updatedAt?: string;
}

export interface TimesheetMatrixResponse {
  weekStart: string; weekEnd: string;
  rows: TimesheetMatrixRow[]; dailyTotals: number[];
  scheduleHours: number[]; weekTotal: number; weekSchedule: number;
  periodStatus?: string;
}

export interface TimesheetMatrixRow {
  projectId: string; projectName: string;
  taskId?: string; taskName?: string;
  dailyHours: number[]; entryIds: (string | null)[];
  totalHours: number; plannedHours: number; isDone: boolean;
}

export interface MatrixCell { id?: string; hours: number; isDone: boolean; notes?: string; }

export interface MatrixSaveRequest {
  weekStart: string; userId?: string;
  cells: MatrixCellUpdate[];
}
export interface MatrixCellUpdate {
  projectId: string; taskId?: string;
  date: string; hours: number; isDone?: boolean; notes?: string;
}

export interface DashboardSummary {
  todayHours: number; weekHours: number; weekScheduledHours: number;
  activeProjectCount: number; recentEntries: RecentEntry[];
}

export interface RecentEntry {
  id: string; date: string; projectName: string; taskName?: string;
  hours: number; status: string;
}

// Leave Management
export enum LeaveStatus { Draft = 'Draft', Pending = 'Pending', Approved = 'Approved', Rejected = 'Rejected', Cancelled = 'Cancelled' }

export interface LeaveType {
  id: string; name: string; description?: string; color: string;
  defaultDaysPerYear: number; requiresApproval: boolean; isPaid: boolean;
  isActive: boolean; sortOrder: number;
}

export interface LeaveBalance {
  id: string; userId: string; userDisplayName?: string;
  leaveTypeId: string; leaveTypeName?: string; leaveTypeColor?: string;
  year: number; totalDays: number; usedDays: number; pendingDays: number;
  carriedOverDays: number; remainingDays: number;
}

export interface LeaveRequest {
  id: string; userId: string; userDisplayName: string;
  leaveTypeId: string; leaveTypeName?: string; leaveTypeColor?: string;
  startDate: string; endDate: string; totalDays: number;
  isHalfDayStart: boolean; isHalfDayEnd: boolean;
  reason?: string; status: string;
  approvedByUserId?: string; approvedByName?: string;
  approvedAt?: string; approverNotes?: string;
  createdAt: string;
}

export interface LeaveOverview {
  balances: LeaveBalance[];
  pendingRequests: LeaveRequest[];
  upcomingLeave: LeaveRequest[];
}

export interface FDCompany { id: string; name: string; }
export interface FDUser { id: string; email: string; firstName: string; lastName: string; displayName: string; }
export interface FDTicket { id: string; subject: string; companyId?: string; applicationId?: string; categoryId?: string; }
export interface FDApplication { id: string; name: string; }
export interface FDCategory { id: string; name: string; parentId?: string; applicationId?: string; }

// Calendar
export interface CalendarDay {
  date: string; dayOfWeek: number; isWorkingDay: boolean; scheduledHours: number;
  entries: CalendarEntry[]; leaveRequests: CalendarLeave[];
  totalHours: number; isToday: boolean;
}
export interface CalendarEntry { id: string; projectName: string; taskName?: string; hours: number; status: string; planningColor?: string; }
export interface CalendarLeave { id: string; leaveTypeName: string; leaveTypeColor: string; status: string; totalDays: number; isHalfDay: boolean; }
export interface CalendarMonthResponse { year: number; month: number; days: CalendarDay[]; monthTotalHours: number; monthScheduledHours: number; }

// Reports
export interface ReportSummary {
  dateFrom: string; dateTo: string; totalHours: number; scheduledHours: number;
  overtimeHours: number; utilizationPercent: number;
  projectBreakdown: ProjectBreakdownItem[]; dailyBreakdown: DailyBreakdownItem[];
}
export interface ProjectBreakdownItem { projectId: string; projectName: string; planningColor?: string; totalHours: number; plannedHours: number; percentOfTotal: number; }
export interface DailyBreakdownItem { date: string; totalHours: number; scheduledHours: number; }
