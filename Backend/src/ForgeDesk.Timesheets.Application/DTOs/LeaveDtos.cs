namespace ForgeDesk.Timesheets.Application.DTOs;

public record LeaveTypeDto(
    Guid Id, string Name, string? Description, string Color,
    decimal DefaultDaysPerYear, bool RequiresApproval, bool IsPaid,
    bool IsActive, int SortOrder);

public record CreateLeaveTypeDto(
    string Name, string? Description, string Color,
    decimal DefaultDaysPerYear, bool RequiresApproval, bool IsPaid, int SortOrder);

public record LeaveBalanceDto(
    Guid Id, Guid UserId, string? UserDisplayName, Guid LeaveTypeId, string? LeaveTypeName, string? LeaveTypeColor,
    int Year, decimal TotalDays, decimal UsedDays, decimal PendingDays,
    decimal CarriedOverDays, decimal RemainingDays);

public record LeaveRequestDto(
    Guid Id, Guid UserId, string UserDisplayName,
    Guid LeaveTypeId, string? LeaveTypeName, string? LeaveTypeColor,
    DateOnly StartDate, DateOnly EndDate, decimal TotalDays,
    bool IsHalfDayStart, bool IsHalfDayEnd,
    string? Reason, string Status,
    Guid? ApprovedByUserId, string? ApprovedByName,
    DateTime? ApprovedAt, string? ApproverNotes,
    DateTime CreatedAt);

public record CreateLeaveRequestDto(
    Guid LeaveTypeId, DateOnly StartDate, DateOnly EndDate,
    bool IsHalfDayStart, bool IsHalfDayEnd, string? Reason);

public record UpdateLeaveRequestDto(
    Guid LeaveTypeId, DateOnly StartDate, DateOnly EndDate,
    bool IsHalfDayStart, bool IsHalfDayEnd, string? Reason);

public record ApproveRejectLeaveDto(string? Notes);

public record LeaveOverviewDto(
    List<LeaveBalanceDto> Balances,
    List<LeaveRequestDto> PendingRequests,
    List<LeaveRequestDto> UpcomingLeave);
