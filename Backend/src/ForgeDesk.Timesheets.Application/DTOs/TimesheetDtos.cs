using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Application.DTOs;

public class TimesheetEntryResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid? TaskId { get; set; }
    public string? TaskName { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketSubject { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int BreakMinutes { get; set; }
    public string? Notes { get; set; }
    public TimesheetEntryStatus Status { get; set; }
    public bool IsDone { get; set; }
}

public class CreateTimesheetEntryRequest
{
    public Guid ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketSubject { get; set; }
    public Guid? ApplicationId { get; set; }
    public Guid? CategoryId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int BreakMinutes { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTimesheetEntryRequest
{
    public Guid? ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketSubject { get; set; }
    public DateOnly? Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? BreakMinutes { get; set; }
    public string? Notes { get; set; }
    public bool? IsDone { get; set; }
}

public class TimesheetMatrixResponse
{
    public DateOnly WeekStart { get; set; }
    public DateOnly WeekEnd { get; set; }
    public List<TimesheetMatrixRow> Rows { get; set; } = new();
    public decimal[] DailyTotals { get; set; } = new decimal[5];
    public decimal[] ScheduleHours { get; set; } = new decimal[5];
    public decimal WeekTotal { get; set; }
    public decimal WeekSchedule { get; set; }
    public string? PeriodStatus { get; set; }
}

public class TimesheetMatrixRow
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid? TaskId { get; set; }
    public string? TaskName { get; set; }
    public Guid? TicketId { get; set; }
    public decimal[] DailyHours { get; set; } = new decimal[5];
    public Guid?[] EntryIds { get; set; } = new Guid?[5];
    public decimal TotalHours { get; set; }
    public decimal PlannedHours { get; set; }
    public bool IsDone { get; set; }
}

public class MatrixSaveRequest
{
    public DateOnly WeekStart { get; set; }
    public List<MatrixCellUpdate> Cells { get; set; } = new();
}

public class MatrixCellUpdate
{
    public Guid? EntryId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public bool IsDone { get; set; }
}
