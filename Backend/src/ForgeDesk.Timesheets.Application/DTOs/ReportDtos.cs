namespace ForgeDesk.Timesheets.Application.DTOs;

public class ReportSummaryResponse
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public decimal TotalHours { get; set; }
    public decimal ScheduledHours { get; set; }
    public decimal OvertimeHours { get; set; }
    public decimal UtilizationPercent { get; set; }
    public List<ProjectBreakdownDto> ProjectBreakdown { get; set; } = new();
    public List<DailyBreakdownDto> DailyBreakdown { get; set; } = new();
}

public class ProjectBreakdownDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? PlanningColor { get; set; }
    public decimal TotalHours { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal PercentOfTotal { get; set; }
}

public class DailyBreakdownDto
{
    public DateOnly Date { get; set; }
    public decimal TotalHours { get; set; }
    public decimal ScheduledHours { get; set; }
}
