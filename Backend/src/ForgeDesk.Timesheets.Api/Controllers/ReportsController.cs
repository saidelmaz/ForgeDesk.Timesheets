using System.Text;
using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public ReportsController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryResponse>> GetSummary(
        [FromQuery] DateOnly dateFrom,
        [FromQuery] DateOnly dateTo,
        [FromQuery] Guid? userId)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var targetUserId = userId ?? _currentUser.UserId;

        // Total logged hours (SQLite-safe decimal sum)
        var totalHours = (decimal)await _context.TimesheetEntries
            .Where(e => e.TenantId == tenantId.Value
                && e.UserId == targetUserId
                && e.Date >= dateFrom
                && e.Date <= dateTo)
            .SumAsync(e => (double)e.Hours);

        // Calculate scheduled hours for the date range
        var schedules = await _context.UserSchedules
            .Where(s => s.UserId == targetUserId)
            .ToListAsync();

        var scheduleByDay = schedules.ToDictionary(s => s.DayOfWeek);
        decimal scheduledHours = 0;
        for (var date = dateFrom; date <= dateTo; date = date.AddDays(1))
        {
            var dow = (int)date.DayOfWeek;
            if (scheduleByDay.TryGetValue(dow, out var schedule))
            {
                if (schedule.IsWorkingDay) scheduledHours += schedule.ScheduledHours;
            }
            else if (dow >= 1 && dow <= 5) // Default Mon-Fri 8h
            {
                scheduledHours += 8m;
            }
        }

        var overtimeHours = Math.Max(0, totalHours - scheduledHours);
        var utilizationPercent = scheduledHours > 0
            ? Math.Round(totalHours / scheduledHours * 100, 1)
            : 0m;

        // Project breakdown
        var projectGroups = await _context.TimesheetEntries
            .Include(e => e.Project)
            .Where(e => e.TenantId == tenantId.Value
                && e.UserId == targetUserId
                && e.Date >= dateFrom
                && e.Date <= dateTo)
            .GroupBy(e => new { e.ProjectId, e.Project.Name, e.Project.PlanningColor, e.Project.PlannedHours })
            .Select(g => new
            {
                g.Key.ProjectId,
                g.Key.Name,
                g.Key.PlanningColor,
                g.Key.PlannedHours,
                TotalHours = (decimal)g.Sum(e => (double)e.Hours)
            })
            .ToListAsync();

        var projectBreakdown = projectGroups.Select(p => new ProjectBreakdownDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.Name,
            PlanningColor = p.PlanningColor,
            TotalHours = p.TotalHours,
            PlannedHours = p.PlannedHours,
            PercentOfTotal = totalHours > 0
                ? Math.Round(p.TotalHours / totalHours * 100, 1)
                : 0
        }).ToList();

        // Daily breakdown
        var dailyGroups = await _context.TimesheetEntries
            .Where(e => e.TenantId == tenantId.Value
                && e.UserId == targetUserId
                && e.Date >= dateFrom
                && e.Date <= dateTo)
            .GroupBy(e => e.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalHours = (decimal)g.Sum(e => (double)e.Hours)
            })
            .OrderBy(g => g.Date)
            .ToListAsync();

        // Build daily breakdown for all days in range
        var dailyBreakdown = new List<DailyBreakdownDto>();
        for (var date = dateFrom; date <= dateTo; date = date.AddDays(1))
        {
            var dow = (int)date.DayOfWeek;
            decimal dayScheduled;
            if (scheduleByDay.TryGetValue(dow, out var schedule))
                dayScheduled = schedule.IsWorkingDay ? schedule.ScheduledHours : 0;
            else
                dayScheduled = (dow >= 1 && dow <= 5) ? 8m : 0m;

            var dayHours = dailyGroups.FirstOrDefault(g => g.Date == date)?.TotalHours ?? 0;

            dailyBreakdown.Add(new DailyBreakdownDto
            {
                Date = date,
                TotalHours = dayHours,
                ScheduledHours = dayScheduled
            });
        }

        return Ok(new ReportSummaryResponse
        {
            DateFrom = dateFrom,
            DateTo = dateTo,
            TotalHours = totalHours,
            ScheduledHours = scheduledHours,
            OvertimeHours = overtimeHours,
            UtilizationPercent = utilizationPercent,
            ProjectBreakdown = projectBreakdown,
            DailyBreakdown = dailyBreakdown
        });
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateOnly dateFrom,
        [FromQuery] DateOnly dateTo,
        [FromQuery] Guid? userId)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var targetUserId = userId ?? _currentUser.UserId;

        var entries = await _context.TimesheetEntries
            .Include(e => e.Project)
            .Include(e => e.Task)
            .Where(e => e.TenantId == tenantId.Value
                && e.UserId == targetUserId
                && e.Date >= dateFrom
                && e.Date <= dateTo)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.Project.Name)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Date,Project,Task,Hours,Status,Notes");

        foreach (var entry in entries)
        {
            var date = entry.Date.ToString("yyyy-MM-dd");
            var project = EscapeCsvField(entry.Project.Name);
            var task = EscapeCsvField(entry.Task?.Name ?? string.Empty);
            var hours = entry.Hours.ToString("0.00");
            var status = entry.Status.ToString();
            var notes = EscapeCsvField(entry.Notes ?? string.Empty);

            sb.AppendLine($"{date},{project},{task},{hours},{status},{notes}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"timesheet-export-{dateFrom:yyyy-MM-dd}-to-{dateTo:yyyy-MM-dd}.csv";
        return File(bytes, "text/csv", fileName);
    }

    private static string EscapeCsvField(string field)
    {
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }
}
