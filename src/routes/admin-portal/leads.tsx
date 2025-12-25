import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Lead, LeadStatus } from "~/mocks/adminPortal";
import { ListChecks, KanbanSquare, Plus, Search, User, Phone, Mail, Calendar, MessageSquare, X } from "lucide-react";
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
]; // Excluded CONVERTED from board usually, or keep it depending on flow. keeping standard pipeline stages.

const statusColors: Record<string, string> = {
  "Incoming": "bg-[#799988]", // Sage
  "No Response": "bg-[#9ca3af]", // Grey
  "Hot Leads": "bg-[#e58b8b]", // Soft Red
  "Pending Call Back": "bg-[#a8b89c]", // Light Green
  "Offers Made": "bg-[#163022]", // Dark Green
  "CONVERTED": "bg-emerald-600"
};

function CreateLeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "MANUAL",
    message: "",
    status: "Incoming"
  });

  const createMutation = useMutation(trpc.crm.createLead.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryOptions().queryKey });
      onClose();
      setFormData({ name: "", email: "", phone: "", source: "MANUAL", message: "", status: "Incoming" });
      alert("Lead created successfully!");
    },
    onError: (err) => {
      alert("Failed to create lead: " + err.message);
    }
  }));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#0f172a]">New Booking/Lead</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
              placeholder="e.g. Zak Smith"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                placeholder="client@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes / Message</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all min-h-[100px]"
              placeholder="Any details about the request..."
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Source</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:outline-none"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="MANUAL">Manual Entry</option>
                <option value="WEBSITE">Website</option>
                <option value="PHONE">Phone</option>
                <option value="REFERRAL">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Initial Status</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                {columns.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-xl bg-[#163022] py-3 text-sm font-bold text-white shadow-lg shadow-[#163022]/20 hover:bg-[#0f241a] hover:shadow-xl transition-all disabled:opacity-70"
            >
              {createMutation.isPending ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadsPipelinePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      alert("Lead converted!");
      void navigate({ to: "/admin-portal/bookings", search: { selectedId: result.bookingId } });
    } catch (e: any) {
      alert("Failed to convert lead: " + e.message);
    }
  };

  if (leadsQuery.isLoading) return <div className="p-12 text-center text-gray-400 italic">Syncing pipeline...</div>;

  return (
    <AdminShell
      title="Leads Pipeline"
      subtitle="Manage your sales pipeline"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-bold text-[#163022] shadow-sm hover:bg-gray-50 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Booking/Lead
          </button>
          <span className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600">
            Total Leads: <span className="text-[#0f172a] ml-1">{leads.length}</span>
          </span>
        </div>
      }
    >
      <CreateLeadModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#163022] p-1 shadow-sm">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${view === "kanban" ? "bg-white text-[#163022] shadow-sm" : "text-white/70 hover:bg-white/10"
              }`}
          >
            <KanbanSquare className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${view === "list" ? "bg-white text-[#163022] shadow-sm" : "text-white/70 hover:bg-white/10"
              }`}
          >
            <ListChecks className="h-3.5 w-3.5" /> List
          </button>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus-within:border-[#163022] focus-within:ring-1 focus-within:ring-[#163022]/20">
          <Search className="mr-2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-64 bg-transparent text-sm font-medium focus:outline-none placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "ALL")}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm focus:border-[#163022] focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          {columns.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-start">
          {columns.map((status) => (
            <div key={status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={`p-3 rounded-xl flex items-center justify-between shadow-sm ${statusColors[status] || "bg-gray-500"}`}>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{status}</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {leadsByStatus[status]?.length || 0}
                </span>
              </div>

              {/* Droppable Zone */}
              <div
                className="space-y-3 min-h-[500px]"
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
                    className="group relative cursor-grab rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 font-bold text-xs uppercase">
                        {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#0f172a] text-sm truncate">{lead.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    {lead.message && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-2 flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5" />
                        <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{lead.message}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase text-gray-400">Source: {lead.source}</span>
                        <span className="text-[9px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                      {status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead.id)}
                          className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {(leadsByStatus[status]?.length || 0) === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                    <p className="text-xs text-gray-400">No leads</p>
                    <p className="text-[10px] text-gray-300 mt-1">Drag leads here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Lead Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Date Added</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#163022] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-[#0f172a]">{lead.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{lead.message || "No notes"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400" /> {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="h-3 w-3 text-gray-400" /> {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium shadow-sm focus:border-[#163022] focus:outline-none"
                      >
                        {columns.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {lead.status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead.id)}
                          className="rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f241a] transition-all"
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="p-12 text-center text-gray-400 italic">No leads found matching your filters.</div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
