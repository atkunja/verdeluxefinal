import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { ScheduleChangeRequest } from "~/mocks/adminPortal";
import { listChangeRequests } from "~/api/adminPortal";
import { Check, Clock, X } from "lucide-react";

export const Route = createFileRoute("/admin-portal/schedule-requests")({
  component: ScheduleRequestsPage,
});

function ScheduleRequestsPage() {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);

  useEffect(() => {
    listChangeRequests().then(setRequests);
  }, []);

  const updateStatus = (id: string, status: "Pending" | "Approved" | "Rejected") => {
    const ok = window.confirm(`Mark request as ${status}?`);
    if (!ok) return;
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)));
  };

  return (
    <AdminShell title="Schedule Change Requests" subtitle="Review and resolve coverage changes.">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-[#f9fafb] text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">Cleaner</th>
              <th className="px-4 py-3">Date Range</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Admin Notes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-semibold text-[#0f172a]">{req.cleaner}</td>
                <td className="px-4 py-3 text-gray-700">{req.dateRange}</td>
                <td className="px-4 py-3 text-gray-700">{req.details}</td>
                <td className="px-4 py-3 text-gray-500">{req.adminNotes || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      req.status === "Pending"
                        ? "bg-amber-50 text-amber-700"
                        : req.status === "Approved"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => updateStatus(req.id, "Approved")}
                      className="rounded-lg border border-gray-200 bg-white p-2 text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "Rejected")}
                      className="rounded-lg border border-gray-200 bg-white p-2 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "Pending")}
                      className="rounded-lg border border-gray-200 bg-white p-2 text-amber-700 hover:bg-amber-50"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
