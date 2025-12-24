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
      return [
        { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { label: "Calendar", view: "calendar", icon: Calendar },
        {
          label: "Management",
          view: "management",
          icon: Briefcase,
          subItems: [
            { label: "Customers", view: "management-customers", icon: Users },
            { label: "Cleaners", view: "management-cleaners", icon: UserCog },
            { label: "Admins", view: "management-admins", icon: Settings },
          ],
        },
        { label: "Requests", view: "cleaner-requests", icon: CalendarOff },
        { label: "Reports", view: "reports", icon: BarChart2 },
        { label: "Phone", view: "phone", icon: Phone },
        {
          label: "Charges",
          view: "charges",
          icon: DollarSign,
          subItems: [
            { label: "Booking Charges", view: "booking-charges", icon: DollarSign, routePath: "/admin-portal/booking-charges" },
            { label: "Bank Transactions", view: "bank-transactions", icon: DollarSign, routePath: "/admin-portal/bank-transactions" },
            { label: "Billing", view: "billing", icon: Settings, routePath: "/admin-portal/billing" },
          ],
        },
        {
          label: "Store Options",
          view: "store-options",
          icon: Settings,
          subItems: [
            { label: "Checklist", view: "store-options-checklist", icon: ClipboardList },
            { label: "Pricing", view: "store-options-pricing", icon: DollarSign },
          ],
        },
      ];
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
        className={`fixed top-[70px] left-0 h-[calc(100vh-70px)] w-20 bg-white border-r border-gray-200 shadow-sm z-[998] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full items-center py-6">
          {/* Navigation Items */}
          <nav className="flex-1 w-full space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.view, item.routePath);
              return (
                <Link
                  key={item.view}
                  to={item.routePath || baseRoute}
                  search={item.routePath ? undefined : { view: item.view }}
                  className={`mx-3 flex items-center justify-center h-12 rounded-xl transition-all duration-200 ${
                    active ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-6 h-6" />
                </Link>
              );
            })}
          </nav>

          {/* Avatar at bottom */}
          <div className="mt-auto pb-2">
            {user ? (
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
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
