using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Domain.Enums;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeaveRequestsController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public LeaveRequestsController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeaveRequestDto>>> GetAll([FromQuery] string? status, [FromQuery] Guid? userId)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var currentUserId = _currentUser.UserId;
        var query = _context.LeaveRequests
            .Include(r => r.LeaveType)
            .Where(r => r.TenantId == tenantId.Value);

        // If userId specified, filter by it; otherwise show current user's requests
        if (userId.HasValue)
            query = query.Where(r => r.UserId == userId.Value);
        else
            query = query.Where(r => r.UserId == currentUserId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeaveStatus>(status, out var s))
            query = query.Where(r => r.Status == s);

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new LeaveRequestDto(
                r.Id, r.UserId, r.UserDisplayName,
                r.LeaveTypeId, r.LeaveType!.Name, r.LeaveType.Color,
                r.StartDate, r.EndDate, r.TotalDays,
                r.IsHalfDayStart, r.IsHalfDayEnd,
                r.Reason, r.Status.ToString(),
                r.ApprovedByUserId, r.ApprovedByName,
                r.ApprovedAt, r.ApproverNotes,
                r.CreatedAt))
            .ToListAsync();
        return Ok(requests);
    }

    [HttpGet("pending-approvals")]
    public async Task<ActionResult<List<LeaveRequestDto>>> GetPendingApprovals()
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var requests = await _context.LeaveRequests
            .Include(r => r.LeaveType)
            .Where(r => r.TenantId == tenantId.Value && r.Status == LeaveStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new LeaveRequestDto(
                r.Id, r.UserId, r.UserDisplayName,
                r.LeaveTypeId, r.LeaveType!.Name, r.LeaveType.Color,
                r.StartDate, r.EndDate, r.TotalDays,
                r.IsHalfDayStart, r.IsHalfDayEnd,
                r.Reason, r.Status.ToString(),
                r.ApprovedByUserId, r.ApprovedByName,
                r.ApprovedAt, r.ApproverNotes,
                r.CreatedAt))
            .ToListAsync();
        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LeaveRequestDto>> Get(Guid id)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var r = await _context.LeaveRequests
            .Include(r => r.LeaveType)
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (r == null) return NotFound();

        return Ok(new LeaveRequestDto(
            r.Id, r.UserId, r.UserDisplayName,
            r.LeaveTypeId, r.LeaveType!.Name, r.LeaveType.Color,
            r.StartDate, r.EndDate, r.TotalDays,
            r.IsHalfDayStart, r.IsHalfDayEnd,
            r.Reason, r.Status.ToString(),
            r.ApprovedByUserId, r.ApprovedByName,
            r.ApprovedAt, r.ApproverNotes,
            r.CreatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<LeaveRequestDto>> Create(CreateLeaveRequestDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var userId = _currentUser.UserId;
        var userName = _currentUser.DisplayName;

        var leaveType = await _context.LeaveTypes.FirstOrDefaultAsync(t => t.Id == dto.LeaveTypeId && t.TenantId == tenantId.Value);
        if (leaveType == null) return BadRequest("Invalid leave type");

        // Calculate total days
        var totalDays = CalculateDays(dto.StartDate, dto.EndDate, dto.IsHalfDayStart, dto.IsHalfDayEnd);

        var entity = new LeaveRequest
        {
            TenantId = tenantId.Value,
            UserId = userId,
            UserDisplayName = userName,
            LeaveTypeId = dto.LeaveTypeId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalDays = totalDays,
            IsHalfDayStart = dto.IsHalfDayStart,
            IsHalfDayEnd = dto.IsHalfDayEnd,
            Reason = dto.Reason,
            Status = leaveType.RequiresApproval ? LeaveStatus.Pending : LeaveStatus.Approved
        };

        _context.LeaveRequests.Add(entity);

        // Update leave balance pending days
        var year = dto.StartDate.Year;
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId.Value && b.UserId == userId && b.LeaveTypeId == dto.LeaveTypeId && b.Year == year);

        if (balance != null)
        {
            if (leaveType.RequiresApproval)
                balance.PendingDays += totalDays;
            else
                balance.UsedDays += totalDays;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new LeaveRequestDto(
            entity.Id, entity.UserId, entity.UserDisplayName,
            entity.LeaveTypeId, leaveType.Name, leaveType.Color,
            entity.StartDate, entity.EndDate, entity.TotalDays,
            entity.IsHalfDayStart, entity.IsHalfDayEnd,
            entity.Reason, entity.Status.ToString(),
            null, null, null, null, entity.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, UpdateLeaveRequestDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status != LeaveStatus.Draft && entity.Status != LeaveStatus.Pending)
            return BadRequest("Cannot edit a request that is already processed");

        var oldDays = entity.TotalDays;
        var totalDays = CalculateDays(dto.StartDate, dto.EndDate, dto.IsHalfDayStart, dto.IsHalfDayEnd);

        entity.LeaveTypeId = dto.LeaveTypeId;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.TotalDays = totalDays;
        entity.IsHalfDayStart = dto.IsHalfDayStart;
        entity.IsHalfDayEnd = dto.IsHalfDayEnd;
        entity.Reason = dto.Reason;
        entity.UpdatedAt = DateTime.UtcNow;

        // Update balance
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId.Value && b.UserId == entity.UserId && b.LeaveTypeId == dto.LeaveTypeId && b.Year == dto.StartDate.Year);
        if (balance != null)
        {
            balance.PendingDays += (totalDays - oldDays);
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult> Submit(Guid id)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status != LeaveStatus.Draft) return BadRequest("Only draft requests can be submitted");
        entity.Status = LeaveStatus.Pending;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult> Approve(Guid id, [FromBody] ApproveRejectLeaveDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status != LeaveStatus.Pending) return BadRequest("Only pending requests can be approved");

        entity.Status = LeaveStatus.Approved;
        entity.ApprovedByUserId = _currentUser.UserId;
        entity.ApprovedByName = _currentUser.DisplayName;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.ApproverNotes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;

        // Move from pending to used
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId.Value && b.UserId == entity.UserId && b.LeaveTypeId == entity.LeaveTypeId && b.Year == entity.StartDate.Year);
        if (balance != null)
        {
            balance.PendingDays -= entity.TotalDays;
            balance.UsedDays += entity.TotalDays;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult> Reject(Guid id, [FromBody] ApproveRejectLeaveDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status != LeaveStatus.Pending) return BadRequest("Only pending requests can be rejected");

        entity.Status = LeaveStatus.Rejected;
        entity.ApprovedByUserId = _currentUser.UserId;
        entity.ApprovedByName = _currentUser.DisplayName;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.ApproverNotes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;

        // Remove from pending
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId.Value && b.UserId == entity.UserId && b.LeaveTypeId == entity.LeaveTypeId && b.Year == entity.StartDate.Year);
        if (balance != null)
        {
            balance.PendingDays -= entity.TotalDays;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult> Cancel(Guid id)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status == LeaveStatus.Cancelled) return BadRequest("Already cancelled");

        var wasApproved = entity.Status == LeaveStatus.Approved;
        var wasPending = entity.Status == LeaveStatus.Pending;

        entity.Status = LeaveStatus.Cancelled;
        entity.UpdatedAt = DateTime.UtcNow;

        // Restore balance
        var balance = await _context.LeaveBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId.Value && b.UserId == entity.UserId && b.LeaveTypeId == entity.LeaveTypeId && b.Year == entity.StartDate.Year);
        if (balance != null)
        {
            if (wasApproved) balance.UsedDays -= entity.TotalDays;
            if (wasPending) balance.PendingDays -= entity.TotalDays;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        if (entity.Status != LeaveStatus.Draft) return BadRequest("Only draft requests can be deleted");
        _context.LeaveRequests.Remove(entity);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static decimal CalculateDays(DateOnly start, DateOnly end, bool halfStart, bool halfEnd)
    {
        var days = 0m;
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
            {
                if ((date == start && halfStart) || (date == end && halfEnd))
                    days += 0.5m;
                else
                    days += 1m;
            }
        }
        return days;
    }
}
