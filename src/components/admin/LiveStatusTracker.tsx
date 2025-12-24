import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { MapPin, Clock, User, ExternalLink, Signal, Navigation } from "lucide-react";
import { formatTime12Hour } from "~/utils/formatTime";

export function LiveStatusTracker() {
    const trpc = useTRPC();
    const activeEntriesQuery = useQuery({
        ...trpc.getActiveTimeEntries.queryOptions(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const activeEntries = activeEntriesQuery.data || [];

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Signal className="w-5 h-5 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 font-heading tracking-tight">Live Status Tracker</h3>
                </div>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                    {activeEntries.length} Active
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                {activeEntriesQuery.isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </div>
                        </div>
                    ))
                ) : activeEntries.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 italic">
                            <Clock className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-semibold mb-1">No Active Cleaners</p>
                        <p className="text-gray-500 text-xs">All cleaners are currently punched out.</p>
                    </div>
                ) : (
                    activeEntries.map((entry: any) => (
                        <div
                            key={entry.id}
                            className="group p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/5 group-hover:scale-110 transition-transform">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {entry.user.firstName} {entry.user.lastName}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Clocked in at {formatTime12Hour(new Date(entry.startTime || Date.now()).toTimeString().split(' ')[0])}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <ExternalLink className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-600 font-semibold">Active Booking</p>
                                        <p className="text-gray-900 truncate">{entry.booking?.serviceType || "Unassigned"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-[11px] bg-green-50/50 p-2 rounded-lg border border-green-100/50">
                                    <MapPin className="w-3.5 h-3.5 text-green-600 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-green-700 font-semibold">Location</p>
                                        <p className="text-gray-900 truncate">{entry.booking?.address || "On the move"}</p>
                                        {entry.lat && entry.lng && (
                                            <a
                                                href={`https://www.google.com/maps?q=${entry.lat},${entry.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline mt-1 font-bold"
                                            >
                                                <Navigation className="w-3 h-3" /> View Map
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Live Updates Active</p>
            </div>
        </div>
    );
}
