using Microsoft.EntityFrameworkCore;
using ForgeDesk.Timesheets.Domain.Entities;

namespace ForgeDesk.Timesheets.Infrastructure.Data;

public class TimesheetDbContext : DbContext
{
    public TimesheetDbContext(DbContextOptions<TimesheetDbContext> options) : base(options) { }

    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectTask> ProjectTasks { get; set; }
    public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
    public DbSet<TimesheetPeriod> TimesheetPeriods { get; set; }
    public DbSet<UserSchedule> UserSchedules { get; set; }
    public DbSet<AppUser> Users { get; set; }
    public DbSet<AppTenant> Tenants { get; set; }
    public DbSet<AppTenantUser> TenantUsers { get; set; }
    public DbSet<LeaveType> LeaveTypes { get; set; }
    public DbSet<LeaveBalance> LeaveBalances { get; set; }
    public DbSet<LeaveRequest> LeaveRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
        });

        modelBuilder.Entity<AppTenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<AppTenantUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.TenantId }).IsUnique();
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(500);
        });

        modelBuilder.Entity<ProjectTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(t => t.Project).WithMany(p => p.Tasks).HasForeignKey(t => t.ProjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(t => t.ParentTask).WithMany(t => t.ChildTasks).HasForeignKey(t => t.ParentTaskId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TimesheetEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.Date });
            entity.HasOne(e => e.Project).WithMany(p => p.TimesheetEntries).HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Task).WithMany(t => t.TimesheetEntries).HasForeignKey(e => e.TaskId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Hours).HasPrecision(10, 2);
        });

        modelBuilder.Entity<TimesheetPeriod>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.WeekStartDate }).IsUnique();
            entity.Property(e => e.TotalHours).HasPrecision(10, 2);
        });

        modelBuilder.Entity<UserSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.DayOfWeek }).IsUnique();
            entity.Property(e => e.ScheduledHours).HasPrecision(5, 2);
        });

        modelBuilder.Entity<LeaveType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DefaultDaysPerYear).HasPrecision(5, 1);
        });

        modelBuilder.Entity<LeaveBalance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.LeaveTypeId, e.Year }).IsUnique();
            entity.Property(e => e.TotalDays).HasPrecision(5, 1);
            entity.Property(e => e.UsedDays).HasPrecision(5, 1);
            entity.Property(e => e.PendingDays).HasPrecision(5, 1);
            entity.Property(e => e.CarriedOverDays).HasPrecision(5, 1);
            entity.HasOne(e => e.LeaveType).WithMany(t => t.LeaveBalances).HasForeignKey(e => e.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.Ignore(e => e.RemainingDays);
        });

        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.Status });
            entity.Property(e => e.TotalDays).HasPrecision(5, 1);
            entity.HasOne(e => e.LeaveType).WithMany(t => t.LeaveRequests).HasForeignKey(e => e.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
