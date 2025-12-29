import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Calendar, Clock, CheckCircle, XCircle, CalendarOff, User } from "lucide-react";
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
    <AdminShell
      title="Schedule Requests"
      subtitle="Manage time-off and availability requests"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Approved</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{approvedRequests.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Rejected</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{rejectedRequests.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="premium-card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">All Requests</h2>
        </div>

        <div className="divide-y divide-slate-50">
          {requests.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <CalendarOff className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-900">No requests yet</p>
              <p className="text-slate-400 mt-1">Time-off requests will appear here</p>
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
    </AdminShell>
  );
}

function RequestCard({ request, onUpdate }: { request: any; onUpdate: (id: number, status: "APPROVED" | "REJECTED", notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(request.adminNotes || "");
  const isPending = request.status === "PENDING";

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const dateRange = `${formatDate(request.startDate)} → ${formatDate(request.endDate)}`;

  return (
    <div className="p-6 hover:bg-slate-50/50 transition-colors group">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div className="flex-1 space-y-3">
          {/* Status + Date */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${request.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" :
                request.status === "REJECTED" ? "bg-rose-50 text-rose-600" :
                  "bg-amber-50 text-amber-600"
              }`}>
              {request.status}
            </span>
            <span className="text-xs text-slate-400">
              Submitted {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#163022] to-[#264e3c] text-white flex items-center justify-center text-xs font-bold">
              {request.cleaner?.firstName?.[0]}{request.cleaner?.lastName?.[0]}
            </div>
            <div>
              <div className="font-bold text-slate-900">{request.cleaner?.firstName} {request.cleaner?.lastName}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>{dateRange}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          {request.reason && (
            <div className="bg-slate-50 rounded-xl p-3 border-l-2 border-slate-200">
              <p className="text-sm text-slate-600 italic">"{request.reason}"</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending ? (
          <div className="flex flex-col gap-3 w-full md:w-80">
            <textarea
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#163022]/10 focus:border-[#163022] transition-all resize-none"
              placeholder="Add admin notes (optional)..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(request.id, "APPROVED", notes)}
                className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => onUpdate(request.id, "REJECTED", notes)}
                className="flex-1 h-10 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 text-right">
            {request.reviewedBy && (
              <div className="text-xs text-slate-500">
                Reviewed by <span className="font-bold text-slate-700">{request.reviewedBy.firstName} {request.reviewedBy.lastName}</span>
              </div>
            )}
            {request.adminNotes && (
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 max-w-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</span>
                {request.adminNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
