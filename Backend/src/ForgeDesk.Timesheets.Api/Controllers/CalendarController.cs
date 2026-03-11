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
public class CalendarController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public CalendarController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<CalendarMonthResponse>> GetMonth(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] Guid? userId)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var targetUserId = userId ?? _currentUser.UserId;
        var today = DateOnly.FromDateTime(DateTime.Today);

        var firstDay = new DateOnly(year, month, 1);
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var lastDay = new DateOnly(year, month, daysInMonth);

        // Load user schedule (DayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday)
        var schedules = await _context.UserSchedules
            .Where(s => s.UserId == targetUserId)
            .ToListAsync();

        var scheduleByDay = schedules.ToDictionary(s => s.DayOfWeek);

        // Load all timesheet entries for this month
        var entries = await _context.TimesheetEntries
            .Include(e => e.Project)
            .Include(e => e.Task)
            .Where(e => e.TenantId == tenantId.Value
                && e.UserId == targetUserId
                && e.Date >= firstDay
                && e.Date <= lastDay)
            .OrderBy(e => e.Date)
            .ToListAsync();

        var entriesByDate = entries.GroupBy(e => e.Date)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Load all leave requests that overlap this month
        var leaveRequests = await _context.LeaveRequests
            .Include(r => r.LeaveType)
            .Where(r => r.TenantId == tenantId.Value
                && r.UserId == targetUserId
                && r.StartDate <= lastDay
                && r.EndDate >= firstDay)
            .ToListAsync();

        var days = new List<CalendarDay>();
        decimal monthTotalHours = 0;
        decimal monthScheduledHours = 0;

        for (var day = 1; day <= daysInMonth; day++)
        {
            var date = new DateOnly(year, month, day);
            var dow = (int)date.DayOfWeek;

            var hasSchedule = scheduleByDay.TryGetValue(dow, out var schedule);
            var isWorkingDay = hasSchedule ? schedule!.IsWorkingDay : (dow >= 1 && dow <= 5);
            var scheduledHours = hasSchedule ? schedule!.ScheduledHours : (isWorkingDay ? 8m : 0m);

            // Entries for this day
            var dayEntries = entriesByDate.TryGetValue(date, out var entryList)
                ? entryList.Select(e => new CalendarEntryDto
                {
                    Id = e.Id,
                    ProjectName = e.Project.Name,
                    TaskName = e.Task?.Name,
                    Hours = e.Hours,
                    Status = e.Status.ToString(),
                    PlanningColor = e.Project.PlanningColor
                }).ToList()
                : new List<CalendarEntryDto>();

            // Leave requests that cover this day
            var dayLeaves = leaveRequests
                .Where(r => r.StartDate <= date && r.EndDate >= date)
                .Select(r => new CalendarLeaveDto
                {
                    Id = r.Id,
                    LeaveTypeName = r.LeaveType?.Name ?? string.Empty,
                    LeaveTypeColor = r.LeaveType?.Color,
                    Status = r.Status.ToString(),
                    TotalDays = r.TotalDays,
                    IsHalfDay = (date == r.StartDate && r.IsHalfDayStart)
                             || (date == r.EndDate && r.IsHalfDayEnd)
                }).ToList();

            var totalHours = dayEntries.Sum(e => e.Hours);
            monthTotalHours += totalHours;
            if (isWorkingDay) monthScheduledHours += scheduledHours;

            days.Add(new CalendarDay
            {
                Date = date,
                DayOfWeek = dow,
                IsWorkingDay = isWorkingDay,
                ScheduledHours = scheduledHours,
                Entries = dayEntries,
                LeaveRequests = dayLeaves,
                TotalHours = totalHours,
                IsToday = date == today
            });
        }

        return Ok(new CalendarMonthResponse
        {
            Year = year,
            Month = month,
            Days = days,
            MonthTotalHours = monthTotalHours,
            MonthScheduledHours = monthScheduledHours
        });
    }
}
