using ForgeDesk.Timesheets.Api.Authorization;
using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Constants;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimesheetMatrixController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public TimesheetMatrixController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [RequirePermission(TimesheetPermissions.Timesheets.View)]
    public async Task<ActionResult<TimesheetMatrixResponse>> GetMatrix([FromQuery] DateOnly weekStart, [FromQuery] Guid? userId)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var targetUserId = userId ?? _currentUser.UserId;
        var monday = weekStart;
        var friday = monday.AddDays(4);

        var entries = await _context.TimesheetEntries
            .Include(e => e.Project)
            .Include(e => e.Task)
            .Where(e => e.TenantId == tenantId.Value && e.UserId == targetUserId && e.Date >= monday && e.Date <= friday)
            .ToListAsync();

        var schedule = await _context.UserSchedules
            .Where(s => s.UserId == targetUserId && s.DayOfWeek >= 1 && s.DayOfWeek <= 5)
            .OrderBy(s => s.DayOfWeek)
            .ToListAsync();

        var scheduleHours = new decimal[5];
        foreach (var s in schedule)
        {
            var idx = s.DayOfWeek - 1;
            if (idx >= 0 && idx < 5) scheduleHours[idx] = s.ScheduledHours;
        }

        var grouped = entries.GroupBy(e => new { e.ProjectId, e.TaskId });
        var rows = new List<TimesheetMatrixRow>();

        foreach (var g in grouped)
        {
            var first = g.First();
            var row = new TimesheetMatrixRow
            {
                ProjectId = first.ProjectId,
                ProjectName = first.Project.Name,
                TaskId = first.TaskId,
                TaskName = first.Task?.Name,
                IsDone = g.All(e => e.IsDone)
            };

            foreach (var entry in g)
            {
                var dayIdx = entry.Date.DayOfWeek switch
                {
                    DayOfWeek.Monday => 0, DayOfWeek.Tuesday => 1, DayOfWeek.Wednesday => 2,
                    DayOfWeek.Thursday => 3, DayOfWeek.Friday => 4, _ => -1
                };
                if (dayIdx >= 0 && dayIdx < 5)
                {
                    row.DailyHours[dayIdx] = entry.Hours;
                    row.EntryIds[dayIdx] = entry.Id;
                }
            }
            row.TotalHours = row.DailyHours.Sum();

            var task = first.TaskId.HasValue ? await _context.ProjectTasks.FindAsync(first.TaskId) : null;
            row.PlannedHours = task?.PlannedHours ?? 0;

            rows.Add(row);
        }

        var dailyTotals = new decimal[5];
        for (int d = 0; d < 5; d++)
            dailyTotals[d] = rows.Sum(r => r.DailyHours[d]);

        var period = await _context.TimesheetPeriods.FirstOrDefaultAsync(p =>
            p.TenantId == tenantId.Value && p.UserId == targetUserId && p.WeekStartDate == monday);

        return Ok(new TimesheetMatrixResponse
        {
            WeekStart = monday,
            WeekEnd = friday,
            Rows = rows.OrderBy(r => r.ProjectName).ThenBy(r => r.TaskName).ToList(),
            DailyTotals = dailyTotals,
            ScheduleHours = scheduleHours,
            WeekTotal = dailyTotals.Sum(),
            WeekSchedule = scheduleHours.Sum(),
            PeriodStatus = period?.Status.ToString()
        });
    }

    [HttpPost]
    [RequirePermission(TimesheetPermissions.Timesheets.Create)]
    public async Task<IActionResult> SaveMatrix([FromBody] MatrixSaveRequest request)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        foreach (var cell in request.Cells)
        {
            if (cell.EntryId.HasValue)
            {
                var entry = await _context.TimesheetEntries.FindAsync(cell.EntryId.Value);
                if (entry != null)
                {
                    if (cell.Hours <= 0)
                    {
                        _context.TimesheetEntries.Remove(entry);
                    }
                    else
                    {
                        entry.Hours = cell.Hours;
                        entry.IsDone = cell.IsDone;
                        entry.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }
            else if (cell.Hours > 0)
            {
                _context.TimesheetEntries.Add(new TimesheetEntry
                {
                    TenantId = tenantId.Value,
                    UserId = _currentUser.UserId,
                    UserDisplayName = _currentUser.DisplayName,
                    ProjectId = cell.ProjectId,
                    TaskId = cell.TaskId,
                    Date = cell.Date,
                    Hours = cell.Hours,
                    IsDone = cell.IsDone
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Matrix saved" });
    }
}
