import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Lead, LeadStatus } from "~/mocks/adminPortal";
import { listLeads, updateLeadStatus } from "~/api/adminPortal";
import { ListChecks, KanbanSquare, Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/admin-portal/leads")({
  component: LeadsPipelinePage,
});

const columns: LeadStatus[] = [
  "Incoming",
  "No Response",
  "Hot Leads",
  "Pending Call Back",
  "Offers Made",
  "CONVERTED",
];

import { useNavigate } from "@tanstack/react-router";

function LeadsPipelinePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const leadsQuery = useQuery(trpc.crm.getLeads.queryOptions());

  const updateStatusMutation = useMutation({
    ...trpc.crm.updateLead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryOptions().queryKey });
    },
  });

  const convertMutation = useMutation({
    ...trpc.crm.convertLeadToBooking.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryOptions().queryKey });
    },
  });

  const leads = useMemo(() => leadsQuery.data || [], [leadsQuery.data]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const term = search.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, search]);

  const leadsByStatus = useMemo(() => {
    // Cast lead status to LeadStatus if compatible, or handle unknown statuses
    return columns.reduce<Record<string, typeof leads>>((acc, status) => {
      acc[status] = filteredLeads.filter((l) => l.status === status);
      return acc;
    }, {});
  }, [filteredLeads]);

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const navigate = useNavigate();

  const handleConvert = async (leadId: number) => {
    if (!window.confirm("Convert this lead to a booking? This will create a client account.")) return;
    try {
      const result = await convertMutation.mutateAsync({ leadId });
      alert("Lead converted and booking created!");
      void navigate({ to: "/admin-portal/bookings", search: { selectedId: result.bookingId } });
    } catch (e: any) {
      alert("Failed to convert lead: " + e.message);
    }
  };

  if (leadsQuery.isLoading) return <div className="p-8 text-center">Loading leads...</div>;

  return (
    <AdminShell
      title="Leads Pipeline"
      subtitle="Track and convert leads."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#163022] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0f241a]">
            <Plus className="h-4 w-4" />
            New Booking/Lead
          </button>
          <span className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            Total Leads: {leads.length}
          </span>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <Search className="mr-2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone"
            className="w-56 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "ALL")}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All Statuses</option>
          {columns.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${view === "kanban" ? "bg-[#163022] text-white" : "text-gray-700"
              }`}
          >
            <KanbanSquare className="h-4 w-4" /> Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${view === "list" ? "bg-[#163022] text-white" : "text-gray-700"
              }`}
          >
            <ListChecks className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((status) => (
            <div key={status} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[#0f172a]">{status}</div>
                <div className="rounded-full bg-[#f5f3ec] px-2 py-1 text-xs text-gray-600">
                  {leadsByStatus[status]?.length || 0}
                </div>
              </div>
              <div
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = Number(e.dataTransfer.getData("text/plain"));
                  if (!isNaN(id)) handleStatusChange(id, status);
                }}
              >
                {leadsByStatus[status]?.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(lead.id))}
                    className="cursor-grab rounded-xl border border-gray-200 bg-[#f9fafb] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#0f172a]">{lead.name}</div>
                      <span className="text-[11px] text-gray-500 capitalize">{lead.source.toLowerCase().replace("_", " ")}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{lead.email}</div>
                    <div className="text-xs text-gray-500">{lead.phone}</div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="rounded-lg bg-white px-2 py-1 text-xs text-gray-700 truncate max-w-[120px]">
                        {lead.message || "No notes"}
                      </div>
                      {status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead.id)}
                          className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Convert
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px]"
                      >
                        {columns.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
                {(leadsByStatus[status]?.length || 0) === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-[#f9fafb] p-3 text-center text-xs text-gray-500">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f9fafb] text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#0f172a]">{lead.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{lead.message}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{lead.email}</div>
                    <div className="text-xs text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{lead.source.toLowerCase().replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lead.status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead.id)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1.5 rounded hover:bg-green-200"
                        >
                          Convert
                        </button>
                      )}
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                      >
                        {columns.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
