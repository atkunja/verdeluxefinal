import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { Search, Plus } from "lucide-react";

export function CrmKanbanDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "WEBSITE",
    status: "new",
    message: "",
  });
  const { data: leads, isLoading, isError } = useQuery(trpc.crm.getLeads.queryOptions());

  const createLead = useMutation(
    trpc.crm.createLead.mutationOptions({
      onSuccess: () => {
        toast.success("Lead created");
        setNewLead({ name: "", email: "", phone: "", source: "WEBSITE", status: "new", message: "" });
        queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to create lead"),
    })
  );

  const updateLead = useMutation(
    trpc.crm.updateLead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.crm.getLeads.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to update lead"),
    })
  );

  const [filter, setFilter] = useState("");
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    if (!filter.trim()) return leads;
    const term = filter.toLowerCase();
    return leads.filter(
      (lead: any) =>
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        (lead.phone || "").toLowerCase().includes(term)
    );
  }, [leads, filter]);

  const grouped = (leads ?? []).reduce<Record<string, any[]>>((acc, lead) => {
    const key = lead.status || "new";
    acc[key] = acc[key] || [];
    acc[key].push(lead);
    return acc;
  }, {});

  const statuses = ["new", "contacted", "qualified", "won", "lost"];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load leads</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase">CRM</p>
            <h3 className="text-lg font-bold text-gray-900">Kanban Dashboard</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search leads"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              {statuses.map((s) => (
                <span key={s} className="px-2 py-1 bg-gray-100 rounded-full">
                  {s}: {(grouped[s] || []).length}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
          <input
            type="text"
            placeholder="Name"
            value={newLead.name}
            onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={newLead.email}
            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newLead.phone}
            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={newLead.source}
            onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="WEBSITE">Website</option>
            <option value="GOOGLE_LSA">Google LSA</option>
            <option value="THUMBTACK">Thumbtack</option>
            <option value="FACEBOOK_AD">Facebook</option>
            <option value="REDDIT">Reddit</option>
            <option value="NEXTDOOR">Nextdoor</option>
            <option value="REFERRAL">Referral</option>
          </select>
          <button
            onClick={() => createLead.mutate(newLead)}
            disabled={createLead.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-1 justify-center"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
        <textarea
          placeholder="Message/Notes"
          value={newLead.message}
          onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statuses.map((status) => (
          <div key={status} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800 capitalize">{status}</h4>
              <span className="text-xs text-gray-500">{(grouped[status] || []).length}</span>
            </div>
            <div className="space-y-2">
              {(filteredLeads.length ? filteredLeads : grouped[status] || []).map((lead) => {
                if (lead.status !== status) return null;
                return (
                  <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-2">
                    <p className="font-semibold text-sm text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-600">{lead.email}</p>
                    <p className="text-xs text-gray-600">{lead.phone}</p>
                    {lead.source && <p className="text-xs text-primary mt-1">{lead.source}</p>}
                    {lead.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lead.message}</p>}
                    <select
                      value={lead.status || "new"}
                      onChange={(e) => updateLead.mutate({ id: lead.id, status: e.target.value })}
                      className="mt-2 w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
