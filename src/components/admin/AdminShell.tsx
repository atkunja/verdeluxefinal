import { ReactNode, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";

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
  { label: "Pricing", icon: Banknote, path: "/admin-portal/pricing" },
  { label: "Settings", icon: Settings, path: "/admin-portal/settings" },
];

export function AdminShell({ title, subtitle, children, actions }: AdminShellProps) {
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
    <aside className="w-20 bg-white border-r border-gray-200 shadow-sm hidden lg:flex flex-col items-center py-6">
      <div className="mb-8">
        <img src="/imported/images/logo.png" alt="Verde Luxe" className="h-9 w-auto" />
      </div>
      <nav className="space-y-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = router.location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group relative flex items-center justify-center"
            >
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${active
                  ? "bg-[#163022] text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 rounded-lg bg-[#111827] px-3 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="h-11 w-11 rounded-full bg-[#163022] text-white flex items-center justify-center font-semibold">
          VL
        </div>
      </div>
    </aside>
  );
}

import { ProfileEditModal } from "./ProfileEditModal";

function AdminTopBar() {
  const { user } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const userInitials = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "A";
    }
    return user?.email?.[0]?.toUpperCase() || "A";
  }, [user]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={() => {
                setShowSearch((prev) => !prev);
                setTimeout(() => searchRef.current?.focus(), 10);
              }}
              className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </button>
            {showSearch && (
              <input
                ref={searchRef}
                type="search"
                placeholder="Search bookings, leads, customers..."
                className="w-full max-w-md rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-2 text-sm focus:border-[#163022] focus:outline-none"
              />
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
