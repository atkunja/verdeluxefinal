import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin-portal/cleaners/availability")({
    component: CleanerAvailabilityPage,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function CleanerAvailabilityPage() {
    const trpc = useTRPC();
    const availabilityQuery = useQuery(trpc.availability.getAllCleanerAvailability.queryOptions());
    const availability = availabilityQuery.data || [];

    // Group by cleaner
    const cleanerSchedules = availability.reduce((acc: any, cur: any) => {
        if (!acc[cur.cleanerId]) {
            acc[cur.cleanerId] = {
                name: `${cur.cleaner.firstName} ${cur.cleaner.lastName}`,
                color: cur.cleaner.color,
                days: {},
            };
        }
        acc[cur.cleanerId].days[cur.dayOfWeek] = {
            startTime: cur.startTime,
            endTime: cur.endTime,
            isAvailable: cur.isAvailable,
        };
        return acc;
    }, {});

    return (
        <AdminShell
            title="Cleaner Availability"
            subtitle="Centralized view of all cleaner schedules."
        >
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-[#f9fafb]">
                        <tr>
                            <th className="sticky left-0 bg-[#f9fafb] px-6 py-4 font-bold text-[#0f172a] border-r border-gray-100 min-w-[200px]">
                                Cleaner
                            </th>
                            {DAYS.map((day) => (
                                <th key={day} className="px-6 py-4 font-bold text-gray-500 text-center min-w-[150px]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Object.entries(cleanerSchedules).map(([id, schedule]: [string, any]) => (
                            <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="sticky left-0 bg-white px-6 py-4 border-r border-gray-100 font-semibold text-[#0f172a]">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: schedule.color || "#163022" }}
                                        />
                                        {schedule.name}
                                    </div>
                                </td>
                                {DAYS.map((_, index) => {
                                    const daySchedule = schedule.days[index];
                                    return (
                                        <td key={index} className="px-4 py-3 text-center">
                                            {daySchedule?.isAvailable ? (
                                                <div className="inline-flex flex-col items-center justify-center rounded-xl bg-green-50/50 border border-green-100/50 p-2 min-w-[100px]">
                                                    <span className="text-[11px] font-bold text-green-700">{daySchedule.startTime}</span>
                                                    <div className="h-2 w-0.5 bg-green-200 my-0.5" />
                                                    <span className="text-[11px] font-bold text-green-700">{daySchedule.endTime}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300 font-medium italic">Unavailable</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}

                        {availabilityQuery.isLoading && (
                            <tr>
                                <td colSpan={8} className="px-6 py-20 text-center text-gray-400 italic">
                                    Mapping schedules...
                                </td>
                            </tr>
                        )}

                        {!availabilityQuery.isLoading && Object.keys(cleanerSchedules).length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-20 text-center text-gray-400 italic">
                                    No availability data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminShell>
    );
}
