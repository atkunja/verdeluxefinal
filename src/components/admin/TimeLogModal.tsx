import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { format } from "date-fns";

interface TimeLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number | null;
}

export function TimeLogModal({ isOpen, onClose, bookingId }: TimeLogModalProps) {
    const trpc = useTRPC();
    const logsQuery = useQuery(
        trpc.getBookingTimeLogs.queryOptions(
            { bookingId: bookingId! },
            { enabled: !!bookingId && isOpen }
        )
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-bold text-[#0f172a]">
                                            Booking Time Logs
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">Verified clock-in/out history</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {logsQuery.isLoading ? (
                                        <div className="py-12 text-center text-sm text-gray-400 italic">Loading logs...</div>
                                    ) : !logsQuery.data || logsQuery.data.length === 0 ? (
                                        <div className="py-12 text-center text-sm text-gray-400 italic">No time logs found for this booking.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {logsQuery.data.map((log) => (
                                                <div
                                                    key={log.id}
                                                    className="p-4 rounded-xl border border-gray-100 bg-[#f9fafb] space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#163022] flex items-center justify-center text-white font-bold text-sm">
                                                                {log.user.firstName?.[0]}{log.user.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-[#0f172a]">
                                                                    {log.user.firstName} {log.user.lastName}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500">{log.user.email}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-[#163022]">
                                                                {log.endTime
                                                                    ? `${((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)} hrs`
                                                                    : "In Progress"}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                {format(new Date(log.startTime), "MMM d, yyyy")}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1 text-gray-500 font-medium">
                                                                <Clock className="w-3 h-3" />
                                                                Punch In
                                                            </div>
                                                            <div className="text-[#0f172a] font-bold">
                                                                {format(new Date(log.startTime), "h:mm a")}
                                                            </div>
                                                            {log.lat && log.lng && (
                                                                <div className="flex items-center gap-1 text-blue-600">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:underline"
                                                                    >
                                                                        View Location
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1 text-gray-500 font-medium">
                                                                <Clock className="w-3 h-3" />
                                                                Punch Out
                                                            </div>
                                                            <div className="text-[#0f172a] font-bold">
                                                                {log.endTime ? format(new Date(log.endTime), "h:mm a") : "--:--"}
                                                            </div>
                                                            {(log as any).outLat && (log as any).outLng && (
                                                                <div className="flex items-center gap-1 text-blue-600">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${(log as any).outLat},${(log as any).outLng}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:underline"
                                                                    >
                                                                        View Location
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`p-2 rounded-lg flex items-start gap-2 text-[11px] ${log.notes?.includes("Verified") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                                        {log.notes?.includes("Verified") ? (
                                                            <CheckCircle className="w-3.5 h-3.5 mt-0.5" />
                                                        ) : (
                                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                                                        )}
                                                        <div>
                                                            <div className="font-bold">Status: {log.notes?.includes("Verified") ? "Verified On-Site" : "Off-Site/Unverified"}</div>
                                                            <div className="opacity-80">{log.notes || "No additional notes provided."}</div>
                                                            {log.locationNote && <div className="mt-1">Note: {log.locationNote}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
