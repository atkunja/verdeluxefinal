import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Activity, User, Tag, Clock } from "lucide-react";

export const Route = createFileRoute("/admin-portal/logs")({
    component: LogsPage,
});

function LogsPage() {
    const trpc = useTRPC();
    const logsQuery = useQuery(trpc.system.getSystemLogs.queryOptions());
    const logs = logsQuery.data || [];

    return (
        <AdminShell
            title="System Logs"
            subtitle="Audit trail of all administrative actions."
        >
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-[#0f172a]">{log.action}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                                    <Tag className="h-3 w-3" />
                                    {log.entity}
                                </span>
                                {log.entityId && (
                                    <span className="text-[10px] font-bold text-gray-400">ID: {log.entityId}</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                {/* We could render before/after diffs here if we wanted complex UI */}
                                Performed action on {log.entity}
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <User className="h-3.5 w-3.5" />
                                    User #{log.userId || "System"}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {logsQuery.isLoading && (
                    <div className="py-20 text-center text-gray-400 italic">
                        Streaming logs...
                    </div>
                )}

                {!logsQuery.isLoading && logs.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400">No logs found.</p>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
