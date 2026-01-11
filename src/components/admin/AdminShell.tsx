import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarRange,
  Users,
  Banknote,
  Clock3,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  Search,
  XCircle,
  LogOut,
  Home,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { useAdminPermissions } from "~/hooks/useAdminPermissions";

interface AdminShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin-portal" },
  { label: "Leads", icon: KanbanSquare, path: "/admin-portal/leads" },
  { label: "Bookings", icon: CalendarRange, path: "/admin-portal/bookings" },
  { label: "Finance", icon: Banknote, path: "/admin-portal/finance" },
  { label: "Messages", icon: MessageSquare, path: "/admin-portal/communications" },
  { label: "Management", icon: Users, path: "/admin-portal/management" },
  { label: "Bank", icon: Banknote, path: "/admin-portal/bank-transactions" },
  { label: "Schedule", icon: Clock3, path: "/admin-portal/schedule-requests" },
  { label: "Revenue", icon: BarChart3, path: "/admin-portal/revenue-reports" },
  { label: "Cleaner Pay", icon: DollarSign, path: "/admin-portal/payroll" },
  { label: "Signups", icon: Users, path: "/admin-portal/signups" },
];

export function AdminShell({ title, subtitle, children, actions }: AdminShellProps) {
  const { user } = useAuthStore();
  const { hasPermission, isLoading, role } = useAdminPermissions();
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const router = useRouterState();

  // Helper to check if current route is allowed
  const isAllowed = useMemo(() => {
    if (role === "OWNER") return true;
    const path = router.location.pathname;

    if (path.startsWith("/admin-portal/bookings")) return hasPermission("manage_bookings");
    if (path.startsWith("/admin-portal/finance") || path.startsWith("/admin-portal/bank-transactions") || path.startsWith("/admin-portal/billing")) return hasPermission("access_bank");
    if (path.startsWith("/admin-portal/revenue-reports")) return hasPermission("view_reports");
    if (path.startsWith("/admin-portal/management")) return hasPermission("manage_admins") || hasPermission("manage_customers") || hasPermission("manage_cleaners");
    if (path.startsWith("/admin-portal/communications")) return hasPermission("use_dialer");
    if (path.startsWith("/admin-portal/leads") || path.startsWith("/admin-portal/signups")) return hasPermission("manage_customers");
    if (path.startsWith("/admin-portal/schedule-requests")) return hasPermission("manage_time_off_requests");

    return true; // Default allow (e.g. Dashboard)
  }, [role, hasPermission, router.location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f0e6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin || !isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-premium p-10 max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Access Denied</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            You do not have permission to access the admin portal.
            Your current role is <span className="text-red-500 font-bold uppercase tracking-wider">{user?.role || "UNKNOWN"}</span>.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full bg-brand-800 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-xl hover:bg-brand-700 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Return to Dashboard
          </button>
          <p className="mt-6 text-sm text-slate-400">
            Account: {user?.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f0e6] text-slate-900 flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full">
            {(title || subtitle || actions) && (
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  {title && <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{title}</h1>}
                  {subtitle && <p className="text-slate-500 font-medium mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>
            )}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const router = useRouterState();
  const { hasPermission, role } = useAdminPermissions();

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (role === "OWNER") return true;

      switch (item.label) {
        case "Dashboard": return true;
        case "Leads": return hasPermission("manage_customers");
        case "Bookings": return hasPermission("manage_bookings");
        case "Finance": return hasPermission("access_bank");
        case "Messages": return hasPermission("use_dialer");
        case "Management": return hasPermission("manage_admins") || hasPermission("manage_customers") || hasPermission("manage_cleaners");
        case "Bank": return hasPermission("access_bank");
        case "Schedule": return hasPermission("manage_time_off_requests");
        case "Revenue": return hasPermission("view_reports");
        case "Signups": return hasPermission("manage_customers");
        default: return true;
      }
    });
  }, [hasPermission, role]);

  const managementIndex = filteredNavItems.findIndex(i => i.label === "Management");
  const mainNavItems = managementIndex !== -1 ? filteredNavItems.slice(0, managementIndex) : filteredNavItems;
  const opsNavItems = managementIndex !== -1 ? filteredNavItems.slice(managementIndex) : [];


  return (
    <aside className="w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col h-screen shrink-0 z-50 shadow-sm">
      {/* Logo Section */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center shadow-lg shadow-brand-800/20">
          <img src="/luxeclean-logo.png" alt="" className="h-6 w-auto invert brightness-0" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 leading-none">LuxeClean</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-600 mt-1">Admin Portal</p>
        </div>
      </div>

      {/* Home Link */}
      <div className="px-4 mb-4">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold hover:bg-emerald-100 hover:border-emerald-200 transition-all group"
        >
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Home className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-sm">Back to Home</span>
        </Link>
      </div>

      {/* Navigation Group */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
        <div>
          <p className="px-3 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Main Menu</p>
          <nav className="flex flex-col gap-1.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = router.location.pathname === item.path ||
                (item.path !== "/admin-portal" && router.location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-item ${active ? 'admin-nav-item-active' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-brand-800'}`} strokeWidth={active ? 2.5 : 2} />
                  <span className="font-semibold">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Operations</p>
          <nav className="flex flex-col gap-1.5">
            {opsNavItems.map((item) => {
              const Icon = item.icon;
              const active = router.location.pathname === item.path ||
                (item.path !== "/admin-portal" && router.location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-item ${active ? 'admin-nav-item-active' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-brand-800'}`} strokeWidth={active ? 2.5 : 2} />
                  <span className="font-semibold">{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-slate-50">
        <Link
          to="/admin-portal/settings"
          search={{ tab: 'checklist' } as any}
          className={`admin-nav-item ${router.location.pathname === "/admin-portal/settings" ? 'admin-nav-item-active' : ''}`}
        >
          <Settings className="h-5 w-5" strokeWidth={2} />
          <span className="font-semibold">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

import { ProfileEditModal } from "./ProfileEditModal";

function AdminTopBar() {
  const { user } = useAuthStore();
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const userInitials = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "A";
    }
    return user?.email?.[0]?.toUpperCase() || "A";
  }, [user]);

  // Use useEffect for debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchQueryOptions = trpc.globalSearch.queryOptions(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 1 }
  );
  const searchResults = useQuery(searchQueryOptions);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex-1 flex items-center gap-4 relative">
            <div className="relative w-full max-w-lg hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border-slate-100 rounded-2xl hover:bg-slate-50 focus:bg-white focus:border-brand-800 transition-all font-medium"
              />

              {searchQuery.length > 1 && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-premium border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300"
                >
                  {searchResults.isLoading ? (
                    <div className="p-8 text-center">
                      <div className="w-6 h-6 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Searching your database...</p>
                    </div>
                  ) : (searchResults.data as any)?.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">No results found</p>
                      <p className="text-xs text-slate-500 mt-1">Try a different keyword or ID</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                      <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Search Results</div>
                      {(searchResults.data as any)?.map((res: any) => (
                        <Link
                          key={res.id}
                          to={res.link}
                          onClick={() => {
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-bold leading-none shrink-0 border border-brand-100 group-hover:bg-brand-800 group-hover:text-white transition-colors">
                            {(res.type as string)[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-800 transition-colors">{res.title}</p>
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{res.type}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{res.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-11 w-11 rounded-xl bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-800 flex items-center justify-center transition-all border border-transparent hover:border-brand-100 relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-600 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().clearAuth();
                window.location.href = "/login";
              }}
              className="h-11 w-11 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all border border-transparent hover:border-rose-100"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <div className="h-8 w-px bg-slate-100 mx-2" />
            <button
              onClick={() => setShowProfileEdit(true)}
              className="flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-800 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-brand-800/20 group-hover:scale-105 transition-transform">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-sm font-bold text-slate-900 group-hover:text-brand-800 transition-colors">
                  {user?.firstName || user?.email || "Admin"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">Portal Manager</span>
              </div>
            </button>
          </div>
        </div>
      </header>
      <ProfileEditModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} />
    </>
  );
}
