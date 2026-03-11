namespace ForgeDesk.Timesheets.Application.DTOs;

public class DashboardSummaryResponse
{
    public decimal TodayHours { get; set; }
    public decimal WeekHours { get; set; }
    public decimal WeekSchedule { get; set; }
    public int PendingApprovals { get; set; }
    public int ActiveProjects { get; set; }
    public List<RecentEntryDto> RecentEntries { get; set; } = new();
}

public class RecentEntryDto
{
    public Guid Id { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? TaskName { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public string Status { get; set; } = string.Empty;
}
