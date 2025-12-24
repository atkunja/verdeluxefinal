import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";

export function MessageNotifications() {
  const trpc = useTRPC();
  const user = useAuthStore((state) => state.user);

  const unreadQuery = useQuery({
    ...trpc.messaging.getUnreadCount.queryOptions({ userId: user?.id ?? 0 }),
    enabled: Boolean(user?.id),
    refetchInterval: 10000,
  });

  if (!user) return null;

  return (
    <div className="relative inline-flex items-center">
      <span className="text-sm text-gray-700">Messages</span>
      <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
        {unreadQuery.data?.count ?? 0}
      </span>
    </div>
  );
}
