using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Enums;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public DashboardController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary()
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId required" });

        var today = DateOnly.FromDateTime(DateTime.Today);
        var monday = today.AddDays(-(int)today.DayOfWeek + 1);
        if (today.DayOfWeek == DayOfWeek.Sunday) monday = monday.AddDays(-7);
        var friday = monday.AddDays(4);

        var todayHours = (decimal)await _context.TimesheetEntries
            .Where(e => e.TenantId == tenantId.Value && e.UserId == _currentUser.UserId && e.Date == today)
            .SumAsync(e => (double)e.Hours);

        var weekHours = (decimal)await _context.TimesheetEntries
            .Where(e => e.TenantId == tenantId.Value && e.UserId == _currentUser.UserId && e.Date >= monday && e.Date <= friday)
            .SumAsync(e => (double)e.Hours);

        var weekSchedule = (decimal)await _context.UserSchedules
            .Where(s => s.UserId == _currentUser.UserId && s.IsWorkingDay)
            .SumAsync(s => (double)s.ScheduledHours);

        var activeProjects = await _context.Projects
            .Where(p => p.TenantId == tenantId.Value && p.IsActive && p.Status == ProjectStatus.Active)
            .CountAsync();

        var recentEntries = await _context.TimesheetEntries
            .Include(e => e.Project).Include(e => e.Task)
            .Where(e => e.TenantId == tenantId.Value && e.UserId == _currentUser.UserId)
            .OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt)
            .Take(5)
            .Select(e => new RecentEntryDto
            {
                Id = e.Id, ProjectName = e.Project.Name, TaskName = e.Task != null ? e.Task.Name : null,
                Date = e.Date, Hours = e.Hours, Status = e.Status.ToString()
            }).ToListAsync();

        return Ok(new DashboardSummaryResponse
        {
            TodayHours = todayHours, WeekHours = weekHours, WeekSchedule = weekSchedule,
            ActiveProjects = activeProjects, RecentEntries = recentEntries
        });
    }
}
