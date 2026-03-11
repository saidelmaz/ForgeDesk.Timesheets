import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, Clock, List, FolderKanban, Menu, X, LogOut, ChevronDown, CalendarOff, CalendarDays, GanttChart, BarChart3 } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Timesheet', href: '/timesheet', icon: Clock },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Planning', href: '/planning', icon: GanttChart },
  { name: 'Entries', href: '/entries', icon: List },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Leave', href: '/leave', icon: CalendarOff },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentTenant, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-900 dark:bg-slate-950 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center h-16 px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[17px] font-semibold text-white tracking-tight">Timesheets</span>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <nav className="px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <item.icon className={`w-[18px] h-[18px] mr-3 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-500">
            {currentTenant?.tenantName || 'ForgeDesk'}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center px-4 lg:px-6">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-slate-500" /></button>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">{user?.firstName} {user?.lastName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 animate-fadeIn">
                <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">{user?.email}</div>
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <LogOut className="w-4 h-4 mr-2.5" />Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-5 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
