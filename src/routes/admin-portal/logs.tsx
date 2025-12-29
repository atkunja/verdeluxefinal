import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Activity, User, Tag, Clock, FileText, Database } from "lucide-react";

export const Route = createFileRoute("/admin-portal/logs")({
    component: LogsPage,
});

function LogsPage() {
    const trpc = useTRPC();
    const logsQuery = useQuery(trpc.system.getSystemLogs.queryOptions());
    const logs = logsQuery.data || [];

    // Action color mapping
    const getActionColor = (action: string) => {
        if (action.toLowerCase().includes('create')) return 'bg-emerald-50 text-emerald-600';
        if (action.toLowerCase().includes('delete')) return 'bg-rose-50 text-rose-600';
        if (action.toLowerCase().includes('update')) return 'bg-blue-50 text-blue-600';
        return 'bg-slate-100 text-slate-600';
    };

    return (
        <AdminShell
            title="System Logs"
            subtitle="Track all administrative actions and changes"
        >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Logs</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{logs.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-slate-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">
                                {logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entities</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">
                                {new Set(logs.map(l => l.entity)).size}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Database className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="premium-card !p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Activity Feed</h2>
                </div>

                <div className="divide-y divide-slate-50">
                    {logs.map((log) => (
                        <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors group flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Activity className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                        <Tag className="h-3 w-3" />
                                        {log.entity}
                                    </span>
                                    {log.entityId && (
                                        <span className="text-[10px] font-bold text-slate-400">ID: {log.entityId}</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-3">
                                    Performed <span className="font-medium">{log.action}</span> on <span className="font-medium">{log.entity}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <User className="h-3.5 w-3.5" />
                                        {log.userId ? `User #${log.userId}` : "System"}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {logsQuery.isLoading && (
                    <div className="py-20 text-center">
                        <div className="h-8 w-8 border-2 border-slate-200 border-t-[#163022] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Loading logs...</p>
                    </div>
                )}

                {!logsQuery.isLoading && logs.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-bold text-slate-900">No logs yet</p>
                        <p className="text-slate-400 mt-1">Activity logs will appear here as actions occur</p>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
