// @ts-nocheck
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Calendar, Users, Package, DollarSign, Menu, X, Settings, ClipboardList, ChevronDown, Phone, BarChart2, CalendarOff, Briefcase, UserCog } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "~/stores/authStore";

interface NavItem {
  label: string;
  view: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
  routePath?: string;
}

interface PortalSidebarProps {
  portalType: "admin" | "cleaner" | "client";
}

export function PortalSidebar({ portalType }: PortalSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "store-options",
    "management",
    "charges",
  ]); // Default expanded
  const router = useRouterState();
  const { user } = useAuthStore();
  const baseRoute =
    portalType === "admin"
      ? "/admin-portal"
      : portalType === "cleaner"
        ? "/cleaner-portal"
        : "/client-portal";

  // Define navigation items based on portal type
  const getNavItems = (): NavItem[] => {
    if (portalType === "admin") {
      const isOwner = user?.role === "OWNER";
      // Ensure permissions is an object even if null/undefined
      const perms = (user?.adminPermissions || {}) as Record<string, boolean>;
      const has = (key: string) => isOwner || !!perms[key];

      const items: NavItem[] = [
        { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
      ];

      if (has("manage_bookings")) {
        items.push({
          label: "Bookings",
          view: "bookings-group",
          icon: Calendar,
          subItems: [
            { label: "Calendar", view: "calendar", icon: Calendar, routePath: "/admin-portal?view=calendar" },
            { label: "Charges", view: "booking-charges", icon: DollarSign, routePath: "/admin-portal/booking-charges" },
            { label: "All Bookings", view: "bookings", icon: Package, routePath: "/admin-portal/bookings" },
          ]
        });
      }

      // Management Group
      const managementSubItems: NavItem[] = [];
      if (has("manage_customers")) {
        managementSubItems.push({ label: "Customers", view: "management-customers", icon: Users, routePath: "/admin-portal/management?tab=customers" });
      }
      if (has("manage_cleaners")) {
        managementSubItems.push({ label: "Cleaners", view: "management-cleaners", icon: UserCog, routePath: "/admin-portal/management?tab=cleaners" });
      }
      if (has("manage_admins")) {
        managementSubItems.push({ label: "Admins & Owners", view: "management-admins", icon: Settings, routePath: "/admin-portal/management?tab=admins" });
      }

      if (managementSubItems.length > 0) {
        items.push({
          label: "Management",
          view: "management",
          icon: Briefcase,
          subItems: managementSubItems,
        });
      }

      if (has("manage_time_off_requests")) {
        items.push({ label: "Requests", view: "cleaner-requests", icon: CalendarOff });
      }

      if (has("view_reports")) {
        items.push({ label: "Reports", view: "reports", icon: BarChart2 });
      }

      if (has("use_dialer")) {
        items.push({ label: "Phone", view: "phone", icon: Phone });
      }

      // Finance Group
      const financeSubItems: NavItem[] = [];
      if (has("view_reports")) { // Closest permission for Bank Transactions
        financeSubItems.push({ label: "Bank Transactions", view: "bank-transactions", icon: ClipboardList, routePath: "/admin-portal/bank-transactions" });
      }
      if (has("manage_pricing")) { // Closest for Billing Settings
        financeSubItems.push({ label: "Billing Settings", view: "billing", icon: Settings, routePath: "/admin-portal/billing" });
      }

      if (financeSubItems.length > 0) {
        items.push({
          label: "Finance",
          view: "finance",
          icon: DollarSign,
          subItems: financeSubItems,
        });
      }

      // Settings Group
      const settingsSubItems: NavItem[] = [];
      if (has("manage_checklists")) {
        settingsSubItems.push({ label: "Checklist Rules", view: "settings-checklist", icon: ClipboardList, routePath: "/admin-portal/settings?tab=checklist" });
      }
      if (has("manage_pricing")) {
        settingsSubItems.push({ label: "Pricing Rules", view: "settings-pricing", icon: DollarSign, routePath: "/admin-portal/settings?tab=pricing" });
      }

      if (settingsSubItems.length > 0) {
        items.push({
          label: "Settings",
          view: "settings",
          icon: Settings,
          subItems: settingsSubItems,
        });
      }

      return items;

    } else if (portalType === "cleaner") {
      return [
        { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { label: "Schedule", view: "schedule", icon: Calendar },
        { label: "Payments", view: "payments", icon: DollarSign },
        { label: "Requests", view: "requests", icon: CalendarOff },
      ];
    } else {
      return [
        { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { label: "Bookings", view: "bookings", icon: Package },
      ];
    }
  };

  const navItems = getNavItems();

  const isActive = (view: string, routePath?: string) => {
    if (routePath) {
      return router.location.pathname.startsWith(routePath);
    }
    const searchParams = new URLSearchParams(router.location.search);
    const currentView = searchParams.get("view") || "dashboard";
    return currentView === view;
  };

  const toggleExpanded = (view: string) => {
    setExpandedItems((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-[999] p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle sidebar menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[998]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[70px] left-0 h-[calc(100vh-70px)] w-20 bg-white border-r border-gray-200 shadow-sm z-[998] transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full items-center py-6">
          {/* Navigation Items */}
          <nav className="flex-1 w-full space-y-2 overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.view, item.routePath) || (item.subItems?.some(sub => isActive(sub.view, sub.routePath)) ?? false);

              return (
                <div key={item.view} className="relative group px-3">
                  <Link
                    to={item.routePath || (item.subItems ? item.subItems[0].routePath || baseRoute : baseRoute)}
                    search={item.routePath ? undefined : (item.subItems ? (item.subItems[0].routePath ? undefined : { view: item.subItems[0].view }) : { view: item.view })}
                    className={`flex items-center justify-center h-12 rounded-xl transition-all duration-200 relative z-10 ${active ? "bg-[#163022] text-white shadow-md shadow-[#163022]/20" : "text-gray-500 hover:bg-gray-100 group-hover:bg-gray-50 group-hover:text-[#163022]"
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-6 h-6" />
                  </Link>

                  {/* Hover Submenu */}
                  {item.subItems && (
                    <div className="absolute left-full top-0 ml-3 hidden group-hover:block z-50">
                      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200 slide-in-from-left-2">
                        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                          {item.label}
                        </div>
                        <div className="flex flex-col gap-1">
                          {item.subItems.map((sub) => {
                            const isSubActive = isActive(sub.view, sub.routePath);
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.view}
                                to={sub.routePath || baseRoute}
                                search={sub.routePath ? undefined : { view: sub.view }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isSubActive
                                  ? "bg-[#163022] text-white shadow-sm"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-[#163022]"
                                  }`}
                              >
                                {SubIcon && <SubIcon className="h-4 w-4" />}
                                {sub.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Avatar at bottom */}
          <div className="mt-auto pb-2">
            {user ? (
              <div className="w-10 h-10 rounded-full bg-[#163022] text-white flex items-center justify-center font-semibold text-sm shadow-md ring-2 ring-white">
                {user.firstName?.[0] || user.email?.[0] || "U"}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
