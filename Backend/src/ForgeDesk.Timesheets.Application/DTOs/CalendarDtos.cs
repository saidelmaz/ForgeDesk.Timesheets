namespace ForgeDesk.Timesheets.Application.DTOs;

public class CalendarMonthResponse
{
    public int Year { get; set; }
    public int Month { get; set; }
    public List<CalendarDay> Days { get; set; } = new();
    public decimal MonthTotalHours { get; set; }
    public decimal MonthScheduledHours { get; set; }
}

public class CalendarDay
{
    public DateOnly Date { get; set; }
    public int DayOfWeek { get; set; }
    public bool IsWorkingDay { get; set; }
    public decimal ScheduledHours { get; set; }
    public List<CalendarEntryDto> Entries { get; set; } = new();
    public List<CalendarLeaveDto> LeaveRequests { get; set; } = new();
    public decimal TotalHours { get; set; }
    public bool IsToday { get; set; }
}

public class CalendarEntryDto
{
    public Guid Id { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? TaskName { get; set; }
    public decimal Hours { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PlanningColor { get; set; }
}

public class CalendarLeaveDto
{
    public Guid Id { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public string? LeaveTypeColor { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
}
