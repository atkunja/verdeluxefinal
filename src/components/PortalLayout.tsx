import { ReactNode } from "react";
import { Footer } from "./Footer";
import { Link } from "@tanstack/react-router";
import { PortalSidebar } from "./PortalSidebar";
import { useAuthStore } from "~/stores/authStore";

interface PortalLayoutProps {
  children: ReactNode;
  portalType: "admin" | "cleaner" | "client";
}

export function PortalLayout({ children, portalType }: PortalLayoutProps) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#edeae1]">
      {/* Portal header bar (minimal) */}
      <div className="fixed top-0 inset-x-0 z-[999] bg-[#f7f4ed] border-b border-[#d7d1c4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/imported/images/logo.png" alt="Verde Luxe" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-[#163022]">Portal</span>
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <Link to="/" className="text-sm font-medium text-[#5c5a55] hover:text-[#163022] hover:underline transition-all">
              Return to Home
            </Link>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-xs text-[#5c5a55]">
              <span className="font-semibold text-[#163022]">{user.firstName || user.email}</span>
              <span className="hidden sm:inline text-[#7a766c] capitalize">{user.role?.toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 pt-14">
        <PortalSidebar portalType={portalType} />

        {/* Main content area with left margin for sidebar on desktop */}
        <main className="flex-grow lg:ml-20 min-h-[calc(100vh-56px)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Footer with left margin for sidebar on desktop */}
      <div className="lg:ml-20 bg-[#f7f4ed] border-t border-[#d7d1c4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
