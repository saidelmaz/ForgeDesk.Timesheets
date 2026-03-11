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
public class LeaveBalancesController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public LeaveBalancesController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeaveBalanceDto>>> GetMyBalances([FromQuery] int? year)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var userId = _currentUser.UserId;
        var targetYear = year ?? DateTime.UtcNow.Year;

        var balances = await _context.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.TenantId == tenantId.Value && b.UserId == userId && b.Year == targetYear)
            .OrderBy(b => b.LeaveType!.SortOrder)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId, null, b.LeaveTypeId, b.LeaveType!.Name, b.LeaveType.Color,
                b.Year, b.TotalDays, b.UsedDays, b.PendingDays,
                b.CarriedOverDays, b.TotalDays + b.CarriedOverDays - b.UsedDays - b.PendingDays))
            .ToListAsync();

        return Ok(balances);
    }

    [HttpGet("overview")]
    public async Task<ActionResult<LeaveOverviewDto>> GetOverview([FromQuery] int? year)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var userId = _currentUser.UserId;
        var targetYear = year ?? DateTime.UtcNow.Year;

        var balances = await _context.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.TenantId == tenantId.Value && b.UserId == userId && b.Year == targetYear && b.LeaveType!.IsActive)
            .OrderBy(b => b.LeaveType!.SortOrder)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId, null, b.LeaveTypeId, b.LeaveType!.Name, b.LeaveType.Color,
                b.Year, b.TotalDays, b.UsedDays, b.PendingDays,
                b.CarriedOverDays, b.TotalDays + b.CarriedOverDays - b.UsedDays - b.PendingDays))
            .ToListAsync();

        var pendingRequests = await _context.LeaveRequests
            .Include(r => r.LeaveType)
            .Where(r => r.TenantId == tenantId.Value && r.UserId == userId && r.Status == Domain.Enums.LeaveStatus.Pending)
            .OrderBy(r => r.StartDate)
            .Select(r => new LeaveRequestDto(
                r.Id, r.UserId, r.UserDisplayName,
                r.LeaveTypeId, r.LeaveType!.Name, r.LeaveType.Color,
                r.StartDate, r.EndDate, r.TotalDays,
                r.IsHalfDayStart, r.IsHalfDayEnd,
                r.Reason, r.Status.ToString(),
                r.ApprovedByUserId, r.ApprovedByName,
                r.ApprovedAt, r.ApproverNotes, r.CreatedAt))
            .ToListAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var upcomingLeave = await _context.LeaveRequests
            .Include(r => r.LeaveType)
            .Where(r => r.TenantId == tenantId.Value && r.UserId == userId && r.Status == Domain.Enums.LeaveStatus.Approved && r.StartDate >= today)
            .OrderBy(r => r.StartDate)
            .Take(5)
            .Select(r => new LeaveRequestDto(
                r.Id, r.UserId, r.UserDisplayName,
                r.LeaveTypeId, r.LeaveType!.Name, r.LeaveType.Color,
                r.StartDate, r.EndDate, r.TotalDays,
                r.IsHalfDayStart, r.IsHalfDayEnd,
                r.Reason, r.Status.ToString(),
                r.ApprovedByUserId, r.ApprovedByName,
                r.ApprovedAt, r.ApproverNotes, r.CreatedAt))
            .ToListAsync();

        return Ok(new LeaveOverviewDto(balances, pendingRequests, upcomingLeave));
    }
}
