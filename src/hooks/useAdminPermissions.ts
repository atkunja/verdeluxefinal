import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";

/**
 * Permission keys that can be assigned to Admin users.
 * Owners bypass all permission checks.
 */
export const PERMISSION_KEYS = [
    "manage_bookings",
    "manage_customers",
    "manage_cleaners",
    "manage_admins",
    "manage_checklists",
    "manage_pricing",
    "view_reports",
    "manage_time_off_requests",
    "use_dialer",
    "access_bank",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

interface UseAdminPermissionsResult {
    /** Check if user has a specific permission */
    hasPermission: (key: PermissionKey) => boolean;
    /** User's role */
    role: "ADMIN" | "OWNER" | "CLIENT" | "CLEANER" | null;
    /** Whether permissions are still loading */
    isLoading: boolean;
    /** All permissions as a record */
    permissions: Record<string, boolean>;
}

/**
 * Hook to get admin permissions directly from the server.
 * This bypasses localStorage and always fetches fresh data.
 */
export function useAdminPermissions(): UseAdminPermissionsResult {
    const trpc = useTRPC();
    const { token } = useAuthStore();

    const { data, isLoading } = useQuery(
        trpc.getCurrentUser.queryOptions(
            { authToken: token || "" },
            {
                enabled: !!token,
                staleTime: 0, // Always refetch
                refetchOnWindowFocus: true,
                refetchOnMount: true,
            }
        )
    );

    const role = (data?.role as UseAdminPermissionsResult["role"]) ?? null;
    const permissions = (data?.adminPermissions as Record<string, boolean>) ?? {};

    const hasPermission = (key: PermissionKey): boolean => {
        // Owners always have all permissions
        if (role === "OWNER") return true;
        // Check the specific permission
        return !!permissions[key];
    };

    return {
        hasPermission,
        role,
        isLoading,
        permissions,
    };
}
