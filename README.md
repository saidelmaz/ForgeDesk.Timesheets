# ForgeDesk.Timesheets

Timesheet management module for [ForgeDesk](https://github.com/saidelmaz) — a modern replacement for legacy timesheet systems with improved UX and time-saving features.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + Zustand |
| **Backend** | ASP.NET Core 8 (Clean Architecture) + EF Core |
| **Database** | PostgreSQL (production) / SQLite (dev) |
| **Real-time** | SignalR |
| **Auth** | JWT + Multi-tenant RBAC (shared with ForgeDesk) |

## Features

### 1. Timesheet Matrix (Weekly Grid)
- Editable weekly grid: rows = Customer/Project/Task, columns = Mon–Fri
- Inline hour entry per cell with auto-save
- Period totals, Actual vs Planned hours comparison
- "Done" completion toggle per row
- Hide/show rows for focused entry
- Footer summary: Leaves, Actual Total, Schedule, Difference
- Import from Planning, Confirm/Submit workflow
- Excel export, Quick Select, Manage List

### 2. Timesheet List (Flat Table)
- Searchable/filterable flat list of all time entries
- Columns: Date, Resource, Project ID/Name, Task, Parent Task, Ticket ID/Name, Actual Hours, Status
- Pagination, sorting, grouping
- Bulk actions and advanced filtering

### 3. Schedule View (Monthly Calendar)
- Monthly calendar with daily rows and hourly timeline (configurable)
- Color-coded project blocks per day
- Leave days highlighted
- Daily summary: Actual Total, Leaves, Total, Schedule, Difference
- Visual warnings for under/over-logged days

### 4. Add/Edit Timesheet Entry
- Resource selector (admin can log for others)
- Date picker with keyboard shortcuts
- Cascading dropdowns: Customer → Project → Task
- ForgeDesk Ticket linking
- Status workflow: Open → Done → Confirmed
- Time entry: Actual hours OR Start/Stop time with break deduction
- Notes/comments per entry

### 5. Planning (Resource Planner)
- Weekly Gantt-style view with hourly time blocks
- Resources listed vertically, days horizontally
- Drag-and-drop project assignment
- "To Plan" sidebar with unassigned tasks
- Daily capacity totals per resource

### 6. Projects & Tasks
- Project list with: ID, Name, Start/End dates, Baseline/Actual hours, Status, Customer, Manager
- Project detail: General info, Tasks, Tickets, Timesheet entries, Attachments, Notes
- Task hierarchy within projects (parent/child tasks)
- Baseline vs Planned vs Actual hour tracking per task
- Budget tracking with over-budget warnings (red indicators)

### 7. Leave Management
- Leave types: Vacation, Sick Leave, Compensatory (ADV), Leave of Absence (configurable)
- Color-coded leave type indicators
- Date range with time selection
- Approval workflow: Pending → Approved / Rejected / Cancelled
- Approver assignment
- Open balance dashboard widget
- Integration with timesheet schedule (leaves block time slots)

### 8. Home Dashboard
- Quick timer widget: select Customer/Project/Task and start/stop
- Today / This Week hour summaries
- Upcoming planning preview
- Leave balance overview
- Recent timesheet entries

### 9. Reports
- My Timesheet report (personal summary)
- Per-project time reports
- Per-customer billing reports
- Resource utilization reports
- Export to CSV/PDF/Excel

### 10. Improvements over Legacy System
- **Auto-save** on matrix cell blur (no manual save needed)
- **Keyboard navigation** (Tab/Enter to move between cells)
- **Quick timer** with one-click start/stop on home page
- **Dark mode** support
- **Mobile responsive** design
- **Real-time notifications** for approval status changes
- **Drag-and-drop** planning
- **Bulk entry** from templates/previous weeks
- **Smart suggestions** based on recent entries
- **ForgeDesk ticket integration** (auto-log time from ticket work)

## Architecture

```
ForgeDesk.Timesheets/
├── Backend/
│   └── src/
│       ├── ForgeDesk.Timesheets.Api/            # Controllers, Hubs, Middleware
│       ├── ForgeDesk.Timesheets.Application/     # Services, DTOs, Interfaces
│       ├── ForgeDesk.Timesheets.Domain/          # Entities, Enums, Value Objects
│       └── ForgeDesk.Timesheets.Infrastructure/  # EF Core, Repositories, Migrations
├── Frontend/
│   └── src/
│       ├── api/          # API service layer (Axios)
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route pages
│       ├── stores/       # Zustand state management
│       ├── hooks/        # Custom React hooks
│       ├── types/        # TypeScript interfaces
│       ├── utils/        # Helper functions
│       └── i18n/         # Internationalization
├── docker-compose.yml
└── README.md
```

## Domain Entities

| Entity | Description |
|--------|-------------|
| `TimesheetEntry` | Core time entry (date, hours, start/stop, resource, project, task, ticket, status) |
| `Project` | Project with baseline hours, customer, manager, status |
| `ProjectTask` | Task within a project (hierarchical, with baseline/planned/actual hours) |
| `Customer` | Customer/client entity linked to projects |
| `PlanningEntry` | Resource planning assignment (resource, project, date, start/end time) |
| `LeaveRequest` | Leave request with type, dates, approver, status |
| `LeaveType` | Configurable leave types (Vacation, Sick, ADV, etc.) |
| `LeaveBalance` | Per-user leave balance tracking |
| `Schedule` | Work schedule definition (hours per day, working days) |
| `TimesheetConfirmation` | Weekly/monthly confirmation record |

## API Endpoints (planned)

### Timesheets
- `GET /api/timesheets/matrix?week={date}` — Weekly matrix data
- `GET /api/timesheets/list` — Flat list with filters
- `GET /api/timesheets/schedule?month={date}` — Monthly schedule
- `POST /api/timesheets` — Create entry
- `PUT /api/timesheets/{id}` — Update entry
- `DELETE /api/timesheets/{id}` — Delete entry
- `POST /api/timesheets/confirm` — Confirm week/period
- `POST /api/timesheets/import-planning` — Import from planning

### Projects
- `GET /api/projects` — List projects
- `GET /api/projects/{id}` — Project detail
- `GET /api/projects/{id}/tasks` — Project tasks
- `GET /api/projects/{id}/timesheet` — Project timesheet entries

### Planning
- `GET /api/planning?week={date}` — Weekly planning
- `POST /api/planning` — Create planning entry
- `PUT /api/planning/{id}` — Update planning entry

### Leaves
- `GET /api/leaves` — List leave requests
- `POST /api/leaves` — Request leave
- `PUT /api/leaves/{id}/approve` — Approve leave
- `PUT /api/leaves/{id}/reject` — Reject leave
- `GET /api/leaves/balance` — Current balance

### Reports
- `GET /api/reports/my-timesheet` — Personal report
- `GET /api/reports/project/{id}` — Project report
- `GET /api/reports/export` — Export data

### Dashboard
- `GET /api/dashboard/summary` — Today/week summary
- `POST /api/dashboard/timer/start` — Start timer
- `POST /api/dashboard/timer/stop` — Stop timer

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- PostgreSQL 16 (or SQLite for development)

### Backend
```bash
cd Backend/src/ForgeDesk.Timesheets.Api
dotnet restore
dotnet run
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## License

Private — ForgeDesk internal module.
