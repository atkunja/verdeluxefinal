import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Lead, LeadStatus } from "~/mocks/adminPortal";
import { ListChecks, KanbanSquare, Plus, Search, User, Phone, Mail, Calendar, MessageSquare, X, Trash2, Users, TrendingUp } from "lucide-react";
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
];

const statusColors: Record<string, string> = {
  "Incoming": "from-slate-500 to-slate-600",
  "No Response": "from-zinc-400 to-zinc-500",
  "Hot Leads": "from-rose-400 to-rose-500",
  "Pending Call Back": "from-amber-400 to-amber-500",
  "Offers Made": "from-[#163022] to-[#264e3c]",
  "CONVERTED": "from-emerald-500 to-emerald-600"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">New Lead</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Add to pipeline</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
            <input
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
              placeholder="e.g. Jane Smith"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                placeholder="client@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone</label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all min-h-[100px] resize-none"
              placeholder="Any details about the request..."
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Source</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:outline-none"
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Status</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#163022] focus:outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                {columns.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-12 rounded-xl bg-[#163022] text-sm font-bold text-white shadow-lg hover:bg-[#264e3c] transition-all disabled:opacity-70"
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

  const handleConvert = (lead: typeof leads[0]) => {
    if (!window.confirm(`Convert ${lead.name} to a booking?`)) return;
    void navigate({
      to: "/admin-portal/bookings",
      search: { createFromLeadId: lead.id } as any
    });
  };

  const deleteLeadMutation = useMutation({
    ...trpc.crm.deleteLead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryOptions().queryKey });
    },
  });

  const handleDelete = (lead: typeof leads[0]) => {
    if (!window.confirm(`Are you sure you want to delete lead ${lead.name}? This action cannot be undone.`)) return;
    deleteLeadMutation.mutate({ id: lead.id });
  };

  // Stats
  const hotLeadsCount = leads.filter(l => l.status === "Hot Leads").length;
  const incomingCount = leads.filter(l => l.status === "Incoming").length;

  if (leadsQuery.isLoading) {
    return (
      <AdminShell title="Leads Pipeline" subtitle="Manage your sales pipeline">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-[#163022] rounded-full" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Leads Pipeline"
      subtitle="Track and convert your sales opportunities"
      actions={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#163022] text-white text-xs font-bold shadow-lg hover:bg-[#264e3c] transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Lead
        </button>
      }
    >
      <CreateLeadModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{leads.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incoming</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{incomingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Hot Leads</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{hotLeadsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </div>
        <div className="premium-card !p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offers Made</p>
              <p className="text-2xl font-black text-[#163022] mt-1">{leadsByStatus["Offers Made"]?.length || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="premium-card !p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${view === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <KanbanSquare className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <ListChecks className="h-3.5 w-3.5" /> List
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-[#163022] focus-within:bg-white transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-48 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "ALL")}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:border-[#163022] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {columns.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-start">
          {columns.map((status) => (
            <div key={status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={`p-3 rounded-xl flex items-center justify-between bg-gradient-to-r ${statusColors[status] || "from-gray-500 to-gray-600"} shadow-md`}>
                <span className="text-xs font-black text-white uppercase tracking-wider">{status}</span>
                <span className="bg-white/25 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {leadsByStatus[status]?.length || 0}
                </span>
              </div>

              {/* Droppable Zone */}
              <div
                className="space-y-3 min-h-[400px] p-2 rounded-2xl bg-slate-50/50 border-2 border-dashed border-transparent hover:border-slate-200 transition-colors"
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
                    className="group relative cursor-grab rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-black text-xs uppercase">
                        {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate">{lead.name}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    {lead.message && (
                      <div className="mt-3 bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{lead.message}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">{lead.source}</span>
                        <span className="text-[10px] text-slate-400 mt-1">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {status !== "CONVERTED" && (
                          <button
                            onClick={() => handleConvert(lead)}
                            className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                          >
                            Convert
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(lead)}
                          className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {(leadsByStatus[status]?.length || 0) === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white/50">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <User className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">No leads</p>
                    <p className="text-[10px] text-slate-300 mt-1">Drag leads here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card !p-0 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[#163022] text-white flex items-center justify-center font-black text-xs uppercase">
                        {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{lead.message || "No notes"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" /> {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:border-[#163022] focus:outline-none"
                      >
                        {columns.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      {lead.status !== "CONVERTED" && (
                        <button
                          onClick={() => handleConvert(lead)}
                          className="h-8 px-3 rounded-lg bg-[#163022] text-xs font-bold text-white hover:bg-[#264e3c] transition-all"
                        >
                          Convert
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(lead)}
                        className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-900">No leads found</p>
              <p className="text-slate-400 mt-1">Try adjusting your filters or create a new lead</p>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
