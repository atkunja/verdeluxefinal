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
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";

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
  { label: "Messages", icon: MessageSquare, path: "/admin-portal/communications" },
  { label: "Management", icon: Users, path: "/admin-portal/management" },
  { label: "Bank", icon: Banknote, path: "/admin-portal/bank-transactions" },
  { label: "Schedule", icon: Clock3, path: "/admin-portal/schedule-requests" },
  { label: "Revenue", icon: BarChart3, path: "/admin-portal/revenue-reports" },
  { label: "Signups", icon: Users, path: "/admin-portal/signups" },
];

export function AdminShell({ title, subtitle, children, actions }: AdminShellProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f3f0e6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6 font-medium">
            You do not have permission to access the admin portal.
            Your current role is <span className="text-red-600 font-bold uppercase tracking-wider">{user?.role || "UNKNOWN"}</span>.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full bg-[#163022] text-white rounded-xl py-3.5 font-bold shadow-lg hover:shadow-xl hover:bg-[#163022]/90 transition-all transform hover:-translate-y-0.5"
          >
            Go Back Home
          </button>
          <p className="mt-4 text-xs text-gray-400">
            Current account: {user?.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f0e6] text-[#111827]">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminTopBar />
          <main className="px-4 pb-10 pt-4 lg:px-6 lg:pt-6">
            <div className="mx-auto w-full">
              {(title || subtitle || actions) && (
                <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    {title && <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>}
                    {subtitle && <p className="text-sm text-[#6b7280]">{subtitle}</p>}
                  </div>
                  {actions}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const router = useRouterState();

  return (
    <aside className="w-16 bg-[#f3f0e6] hidden lg:flex flex-col items-center py-6">
      {/* Logo */}
      <div className="mb-8">
        <img src="/imported/images/logo.png" alt="Verde Luxe" className="h-8 w-auto" />
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = router.location.pathname === item.path ||
            (item.path !== "/admin-portal" && router.location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex items-center justify-center"
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${active
                  ? "bg-[#163022] text-white shadow-md"
                  : "text-[#5c5a55] hover:bg-[#e8e5dc] hover:text-[#163022]"
                  }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap z-50">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section with settings icon */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <a
          href="/admin-portal/settings"
          className="group relative flex items-center justify-center"
        >
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[#5c5a55] hover:bg-[#e8e5dc] hover:text-[#163022] transition-all duration-200">
            <Settings className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap z-50">
            Settings
          </div>
        </a>
      </div>
    </aside>
  );
}

import { ProfileEditModal } from "./ProfileEditModal";

function AdminTopBar() {
  const { user } = useAuthStore();
  const trpc = useTRPC();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
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
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-3 relative">
            <button
              onClick={() => {
                setShowSearch((prev) => !prev);
                if (!showSearch) {
                  setTimeout(() => searchRef.current?.focus(), 10);
                } else {
                  setSearchQuery("");
                }
              }}
              className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </button>
            {showSearch && (
              <div className="w-full max-w-md relative">
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings, leads, customers..."
                  className="w-full rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-2 text-sm focus:border-[#163022] focus:outline-none transition-all"
                />

                {/* Search Results Dropdown */}
                {showSearch && searchQuery.length > 1 && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {searchResults.isLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                    ) : (searchResults.data as any)?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No results found for "{searchQuery}"</div>
                    ) : (
                      <div className="max-h-[70vh] overflow-y-auto py-2">
                        {(searchResults.data as any)?.map((res: any) => (
                          <Link
                            key={res.id}
                            to={res.link}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="h-10 w-10 rounded-xl bg-[#f0fdf4] text-[#166534] flex items-center justify-center text-xs font-bold shrink-0">
                              {(res.type as string)[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{res.title}</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#163022] transition-colors">{res.type}</span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{res.subtitle}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-[#f9fafb] pl-1 pr-3 py-1 hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[#163022] text-white flex items-center justify-center text-sm font-semibold">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-sm font-semibold text-[#111827]">
                  {user?.firstName || user?.email || "Admin"}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-[#6b7280]">Admin</span>
              </div>
            </button>
          </div>
        </div>
      </header>
      <ProfileEditModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} />
    </>
  );
}
