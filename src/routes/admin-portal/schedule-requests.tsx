
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin-portal/schedule-requests")({
  component: ScheduleRequestsPage,
});

function ScheduleRequestsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const requestsQuery = useQuery(trpc.getAllTimeOffRequests.queryOptions());

  const updateStatusMutation = useMutation(trpc.updateTimeOffRequestStatus.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.getAllTimeOffRequests.queryOptions().queryKey as any);
      toast.success("Request updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update request");
    },
  }));

  const requests = requestsQuery.data?.requests || [];
  const pendingRequests = requests.filter((r) => r.status === "PENDING" && !r.isCleared);
  const approvedRequests = requests.filter((r) => r.status === "APPROVED");
  const rejectedRequests = requests.filter((r) => r.status === "REJECTED");

  return (
    <AdminShell title="Schedule Change Requests">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Pending Requests"
            count={pendingRequests.length}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
          />
          <SummaryCard
            title="Approved"
            count={approvedRequests.length}
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
          />
          <SummaryCard
            title="Rejected"
            count={rejectedRequests.length}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            bgColor="bg-red-50"
            borderColor="border-red-200"
          />
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Requests</h2>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No schedule change requests found.
              </div>
            ) : (
              requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onUpdate={async (id, status, notes) => {
                    await updateStatusMutation.mutateAsync({ requestId: id, status, adminNotes: notes });
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function SummaryCard({ title, count, icon, bgColor, borderColor }: { title: string; count: number; icon: React.ReactNode; bgColor: string; borderColor: string }) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-6 flex flex-col items-center justify-center text-center shadow-sm`}>
      <div className="mb-3 p-3 bg-white rounded-full shadow-sm">{icon}</div>
      <h3 className="text-gray-600 font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
  );
}

function RequestCard({ request, onUpdate }: { request: any; onUpdate: (id: number, status: "APPROVED" | "REJECTED", notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(request.adminNotes || "");
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show actionable area for pending requests
  const isPending = request.status === "PENDING";

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dateRange = `${formatDate(request.startDate)} → ${formatDate(request.endDate)}`;

  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${request.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                request.status === "REJECTED" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"}`}>
              {request.status}
            </span>
            <span className="text-xs text-gray-400">
              Submitted {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {request.cleaner?.firstName?.[0]}{request.cleaner?.lastName?.[0]}
            </div>
            <div className="font-semibold text-gray-900">{request.cleaner?.firstName} {request.cleaner?.lastName}</div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{dateRange}</span>
          </div>

          {request.reason && (
            <div className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-2 mt-2">
              "{request.reason}"
            </div>
          )}
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2 w-full md:w-auto min-w-[300px]">
            <textarea
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Add admin notes (optional)..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(request.id, "APPROVED", notes)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onUpdate(request.id, "REJECTED", notes)}
                className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            {request.reviewedBy && (
              <div className="text-xs text-gray-500">
                Reviewed by <span className="font-medium text-gray-900">{request.reviewedBy.firstName} {request.reviewedBy.lastName}</span>
              </div>
            )}
            {request.adminNotes && (
              <div className="text-sm bg-gray-100 rounded-lg px-3 py-2 text-gray-700 mt-2 max-w-md text-right">
                <span className="font-semibold text-xs text-gray-500 block text-left mb-1">Admin Notes:</span>
                {request.adminNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
