import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { Loader2, Plus, Pencil, Trash2, Check, X, ClipboardList, DollarSign, Trash, Save, Globe, MessageSquare, History } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { BillingConfig } from "~/mocks/adminPortal"; // Keeping Billing mock for now
import { getBillingConfig } from "~/api/adminPortal";
import { ErrorBoundary } from "~/components/ErrorBoundary";

type SettingsTab = "checklist" | "pricing" | "billing" | "website" | "leadSources" | "communications" | "logs";

export const Route = createFileRoute("/admin-portal/settings")({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>): { tab: SettingsTab } => {
    return {
      tab: (search.tab as SettingsTab) || "checklist",
    };
  },
});

function SettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ from: Route.id });
  const tab = search.tab;

  const setTab = (t: SettingsTab) => {
    navigate({ search: ((prev: any) => ({ ...prev, tab: t })) as any });
  };

  const leadSourcesQuery = useQuery(trpc.crm.getLeadSources.queryOptions());
  const createLeadSourceMutation = useMutation(trpc.crm.createLeadSource.mutationOptions());
  const deleteLeadSourceMutation = useMutation(trpc.crm.deleteLeadSource.mutationOptions());

  const tabs = [
    { id: "checklist" as const, label: "Checklists", icon: ClipboardList },
    { id: "pricing" as const, label: "Pricing", icon: DollarSign },
    { id: "website" as const, label: "Website", icon: Globe },
    { id: "leadSources" as const, label: "Lead Sources", icon: Plus },
    { id: "communications" as const, label: "Communications", icon: MessageSquare },
    { id: "logs" as const, label: "System Logs", icon: History },
    { id: "billing" as const, label: "Billing", icon: DollarSign },
  ];

  return (
    <AdminShell
      title="Settings"
      subtitle="Configure your business operations"
    >
      {/* Tab Navigation */}
      <div className="premium-card !p-2 mb-8">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${tab === t.id
                ? "bg-[#163022] text-white shadow-lg"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "checklist" && <ChecklistTab />}
      {tab === "pricing" && <PricingTab />}
      {tab === "billing" && <BillingTab />}
      {tab === "website" && <WebsiteTab />}
      {tab === "leadSources" && <LeadSourcesTab />}
      {tab === "communications" && <ErrorBoundary><CommunicationsTab /></ErrorBoundary>}
      {tab === "logs" && <ErrorBoundary><LogsTab /></ErrorBoundary>}
    </AdminShell>
  );
}

function LeadSourcesTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const leadSourcesQuery = useQuery(trpc.crm.getLeadSources.queryOptions());
  const createLeadSourceMutation = useMutation(trpc.crm.createLeadSource.mutationOptions());
  const deleteLeadSourceMutation = useMutation(trpc.crm.deleteLeadSource.mutationOptions());

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">LSC</span>
            Lead Source Categories
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              id="new-lead-source"
              placeholder="e.g. Google LSA, Yelp"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button
              onClick={async () => {
                const input = document.getElementById("new-lead-source") as HTMLInputElement;
                if (!input || !input.value) return;
                try {
                  await createLeadSourceMutation.mutateAsync({ name: input.value });
                  input.value = "";
                  void queryClient.invalidateQueries({ queryKey: trpc.crm.getLeadSources.queryOptions().queryKey });
                  toast.success("Lead source added");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              className="rounded-xl bg-[#163022] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-[#0f241a] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {((leadSourcesQuery.data as any) || []).map((source: any) => (
            <div key={source.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
              <span className="font-semibold text-gray-900">{source.name}</span>
              <button
                onClick={async () => {
                  if (!confirm("Delete this lead source?")) return;
                  try {
                    await deleteLeadSourceMutation.mutateAsync({ id: source.id });
                    void queryClient.invalidateQueries({ queryKey: trpc.crm.getLeadSources.queryOptions().queryKey });
                    toast.success("Lead source deleted");
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunicationsTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: templates, isLoading, isError, error } = useQuery(trpc.email.getEmailTemplates.queryOptions());
  const updateMutation = useMutation(trpc.email.updateEmailTemplate.mutationOptions());
  const deleteMutation = useMutation(trpc.email.deleteEmailTemplate.mutationOptions());
  const seedMutation = useMutation(trpc.seedDefaultEmailTemplates.mutationOptions());

  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="flex h-64 items-center justify-center flex-col gap-2"><Loader2 className="h-8 w-8 animate-spin text-brand-800" /><p className="text-sm text-gray-500">Loading templates...</p></div>;

  if (isError) return (
    <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
      <p className="text-red-600 font-bold mb-2">Failed to load templates</p>
      <p className="text-sm text-red-500 font-mono mb-4">{error?.message}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-semibold text-sm">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-[#0f172a]">Email Templates</h2>
          <p className="text-sm text-gray-500">Customize automated emails sent to clients and staff.</p>
        </div>
        <button
          onClick={async () => {
            await (seedMutation as any).mutateAsync(undefined);
            queryClient.invalidateQueries({ queryKey: trpc.email.getEmailTemplates.queryOptions().queryKey });
            toast.success("Default templates seeded");
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
        >
          Seed Defaults
        </button>
      </div>

      <TestEmailSection />

      <div className="grid gap-6">
        {(templates || []).map((template) => (
          <div key={template.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {editingId === template.id ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await updateMutation.mutateAsync({
                    id: template.id,
                    subject: fd.get("subject") as string,
                    body: fd.get("body") as string,
                  });
                  setEditingId(null);
                  queryClient.invalidateQueries({ queryKey: trpc.email.getEmailTemplates.queryOptions().queryKey });
                  toast.success("Template updated");
                }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    <button type="submit" className="p-2 text-emerald-600 hover:text-emerald-700"><Check className="w-5 h-5" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                  <input name="subject" defaultValue={template.subject} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Body</label>
                  <textarea name="body" defaultValue={template.body} rows={8} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <div className="text-xs font-bold text-blue-800 uppercase mb-1">Available Variables</div>
                  <div className="flex flex-wrap gap-2">
                    {['{{clientName}}', '{{bookingId}}', '{{scheduledDate}}', '{{scheduledTime}}'].map(v => (
                      <code key={v} className="bg-white px-1.5 py-0.5 rounded border border-blue-100 text-[10px] font-bold text-blue-600">{v}</code>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{template.type}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">Subject: {template.subject}</div>
                  <p className="text-sm text-gray-500 line-clamp-3 mt-2 leading-relaxed">{template.body}</p>
                </div>
                <button
                  onClick={() => setEditingId(template.id)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this template?")) return;
                    try {
                      await deleteMutation.mutateAsync({ id: template.id });
                      queryClient.invalidateQueries({ queryKey: trpc.email.getEmailTemplates.queryOptions().queryKey });
                      toast.success("Template deleted");
                    } catch (e: any) {
                      toast.error("Failed to delete template");
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {(!templates || templates.length === 0) && (
          <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No email templates found. Click "Seed Defaults" to restore.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogsTab() {
  const trpc = useTRPC();
  const { data: logs, isLoading, isError, error } = useQuery(trpc.system.getSystemLogs.queryOptions());

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  if (isError) return (
    <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
      <p className="text-red-600 font-bold mb-2">Failed to load logs</p>
      <p className="text-sm text-red-500 font-mono">{error?.message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="premium-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f9fafb] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Action</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Entity</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logs || []).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${log.action.includes("deleted") || log.action.includes("cancel") ? "bg-red-50 text-red-700" :
                      log.action.includes("created") ? "bg-emerald-50 text-emerald-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                      {log.action.replace("booking.", "")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {log.entity} #{log.entityId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                      <span className="text-xs text-gray-600 font-medium">Logged</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(logs || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChecklistTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(trpc.getChecklistTemplates.queryOptions());
  const createMutation = useMutation(trpc.createChecklistTemplate.mutationOptions());
  const deleteMutation = useMutation(trpc.deleteChecklistTemplate.mutationOptions());

  const [isCreating, setIsCreating] = useState(false);

  const templates = data?.templates || [];

  const groupedTemplates = useMemo(() => {
    return templates.reduce<Record<string, typeof templates>>((acc, template) => {
      const type = (template.serviceType || "OTHER") as string;
      if (!acc[type]) acc[type] = [];
      acc[type]!.push(template);
      return acc;
    }, {});
  }, [templates]);

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="font-bold text-lg text-[#0f172a]">Checklist Templates</h2>
          <p className="text-sm text-gray-500">Manage cleaning checklists for different service types.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#163022] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f241a] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {isCreating && (
        <CreateChecklistForm
          onCancel={() => setIsCreating(false)}
          onSuccess={() => { setIsCreating(false); queryClient.invalidateQueries({ queryKey: trpc.getChecklistTemplates.queryOptions().queryKey }) }}
        />
      )}

      {Object.entries(groupedTemplates).map(([serviceType, group]) => (
        <div key={serviceType} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-50 pb-2">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-400">{serviceType}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {group.map((template) => (
              <article key={template.id} className="rounded-xl border border-gray-200 bg-[#f9fafb] p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-[#0f172a]">{template.name}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={async () => {
                        if (!window.confirm("Delete template?")) return;
                        try {
                          await deleteMutation.mutateAsync({ templateId: template.id });
                          queryClient.invalidateQueries({ queryKey: trpc.getChecklistTemplates.queryOptions().queryKey });
                          toast.success("Template deleted");
                        } catch (e) { toast.error("Failed to delete"); }
                      }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-1 pl-4 text-sm text-gray-600 list-disc marker:text-gray-300">
                  {template.items.slice(0, 4).map((item, idx) => (
                    <li key={idx}>{(item as any).description}</li>
                  ))}
                  {template.items.length > 4 && (
                    <li className="text-xs text-gray-500 font-medium italic">
                      +{template.items.length - 4} more items
                    </li>
                  )}
                </ul>
              </article>
            ))}
          </div>
        </div>
      ))}
      {templates.length === 0 && !isCreating && (
        <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">No templates found. Create one to get started.</div>
      )}
    </div>
  );
}

function TestEmailSection() {
  const trpc = useTRPC();
  const sendTestMutation = useMutation(trpc.email.sendTestEmail.mutationOptions());
  const [email, setEmail] = useState("");

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Test Your Email Configuration
        </h3>
        <p className="text-sm text-blue-700/80 mt-1">
          Send a test email to verify that your SMTP settings are correct.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) return;
          try {
            await sendTestMutation.mutateAsync({ email });
            toast.success("Test email sent!");
            setEmail("");
          } catch (err: any) {
            toast.error(err.message || "Failed to send test email");
          }
        }}
        className="flex gap-2 w-full md:w-auto"
      >
        <input
          type="email"
          placeholder="Enter email address..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl border border-blue-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full md:w-64"
        />
        <button
          type="submit"
          disabled={sendTestMutation.isPending}
          className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {sendTestMutation.isPending ? "Sending..." : "Send Test"}
        </button>
      </form>
    </div>
  );
}

function CreateChecklistForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  const trpc = useTRPC();
  const createMutation = useMutation(trpc.createChecklistTemplate.mutationOptions());
  const [items, setItems] = useState<string[]>([""]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const serviceType = formData.get("serviceType") as string;

    const validItems = items.filter(i => i.trim() !== "").map((desc, idx) => ({ description: desc, order: idx }));

    if (!name || !serviceType || validItems.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        serviceType,
        items: validItems
      });
      toast.success("Template created!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
      <h3 className="font-bold text-lg mb-4 text-[#163022]">New Checklist Template</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Template Name</label>
          <input name="name" placeholder="e.g. Standard Kitchen" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Type</label>
          <select name="serviceType" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" required>
            <option value="REGULAR">Regular Clean</option>
            <option value="DEEP">Deep Clean</option>
            <option value="MOVE_IN_OUT">Move In/Out</option>
            <option value="POST_CONSTRUCTION">Post Construction</option>
          </select>
        </div>
      </div>

      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Checklist Items</label>
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-gray-400 text-sm py-2 font-mono w-6 text-right">{idx + 1}.</span>
            <input
              value={item}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx] = e.target.value;
                setItems(newItems);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Task description..."
              autoFocus={idx === items.length - 1}
            />
            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 px-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems([...items, ""])} className="text-sm font-semibold text-[#163022] hover:underline mb-6 pl-8">+ Add Item</button>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
        <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold bg-[#163022] text-white hover:bg-[#0f241a]">Save Template</button>
      </div>
    </form>
  )
}

function WebsiteTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // SEO Queries
  const seoQuery = useQuery(trpc.seo.getSEOMetadata.queryOptions());
  const updateSEOMutation = useMutation(trpc.seo.updateSEOMetadata.mutationOptions());
  const createSEOMutation = useMutation(trpc.seo.createSEOMetadata.mutationOptions());

  // FAQ Queries
  const faqQuery = useQuery(trpc.faq.getFaqs.queryOptions());
  const createFaqMutation = useMutation(trpc.faq.createFaq.mutationOptions());
  const deleteFaqMutation = useMutation(trpc.faq.deleteFaq.mutationOptions());

  const [editingSEO, setEditingSEO] = useState(false);

  // Find Home Page SEO ("/")
  const homeSEO = (seoQuery.data as any[])?.find((m: any) => m.path === "/") || null;

  const handleUpdateSEO = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      keywords: formData.get("keywords") as string,
    };

    try {
      if (homeSEO) {
        await updateSEOMutation.mutateAsync({ id: homeSEO.id, ...data });
        toast.success("Home SEO updated");
      } else {
        await createSEOMutation.mutateAsync({ path: "/", ...data });
        toast.success("Home SEO created");
      }
      queryClient.invalidateQueries({ queryKey: trpc.seo.getSEOMetadata.queryOptions().queryKey });
      setEditingSEO(false);
    } catch (err) {
      toast.error("Failed to save SEO");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Globe className="w-32 h-32 text-[#163022]" /></div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight relative z-10">
          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">SEO</span>
          Home Page META
        </h3>

        {seoQuery.isLoading ? <Loader2 className="animate-spin text-gray-400" /> : (
          <form onSubmit={handleUpdateSEO} className="relative z-10 grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Site Title</label>
              <input
                name="title"
                defaultValue={homeSEO?.title || "V-Luxe Cleaning | Premium Residential Cleaning"}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Meta Keywords</label>
              <input
                name="keywords"
                defaultValue={homeSEO?.keywords || "cleaning, luxury, residential, maid service, house cleaning"}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-semibold text-gray-700">Meta Description</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={homeSEO?.description || "V-Luxe provides premium residential cleaning services with a focus on quality, reliability, and luxury experience."}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-[#163022] px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-2">
                <Save className="w-4 h-4" /> Save SEO
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">FAQ</span>
          Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {(faqQuery.data as any[])?.map((faq: any) => (
            <div key={faq.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group relative hover:bg-white hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-gray-900">{faq.question}</div>
                <button
                  onClick={async () => {
                    if (!confirm("Delete FAQ?")) return;
                    await deleteFaqMutation.mutateAsync({ id: faq.id });
                    queryClient.invalidateQueries({ queryKey: trpc.faq.getFaqs.queryOptions().queryKey });
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600">{faq.answer}</div>
            </div>
          ))}

          {/* Quick Add FAQ Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const q = fd.get("question") as string;
              const a = fd.get("answer") as string;
              if (!q || !a) return;

              try {
                await createFaqMutation.mutateAsync({ question: q, answer: a, category: "General" });
                (e.target as HTMLFormElement).reset();
                queryClient.invalidateQueries({ queryKey: trpc.faq.getFaqs.queryOptions().queryKey });
                toast.success("FAQ Added");
              } catch (err) { toast.error("Failed to add FAQ"); }
            }}
            className="mt-4 p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50"
          >
            <input name="question" placeholder="New Question..." className="w-full bg-transparent font-bold text-sm mb-2 outline-none placeholder:text-gray-400" required />
            <textarea name="answer" placeholder="Answer..." rows={2} className="w-full bg-transparent text-sm text-gray-600 outline-none resize-none placeholder:text-gray-300" required />
            <div className="flex justify-end mt-2">
              <button type="submit" className="text-xs font-bold text-[#163022] bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all">+ Add FAQ</button>
            </div>
          </form>
        </div>
      </section>

      <BlogSection />

      <LocationSection />

      {/* Keeping Legal as Mock for now since no backend yet */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm opacity-60 pointer-events-none grayscale">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Coming Soon to Backend</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">LGL</span>
          Legal & Policy Pages
        </h3>
        <div className="space-y-4 blur-[2px]">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Privacy Policy</label>
            <textarea rows={2} defaultValue="..." className="w-full rounded-xl border border-gray-200 px-4 py-2" />
          </div>
        </div>
      </section>
    </div >
  );
}

// Pricing Tab Logic (Reused from previous step)
function PricingTab() {
  const [isCreating, setIsCreating] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient(); // Added queryClient for CouponsSection

  const { data, isLoading, refetch } = useQuery(trpc.getPricingRules.queryOptions());
  const createMutation = useMutation(trpc.createPricingRule.mutationOptions());
  const deleteMutation = useMutation(trpc.deletePricingRule.mutationOptions());

  const handleCreate = async (formData: any) => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Rule created");
      setIsCreating(false);
      refetch();
    } catch (err) {
      toast.error("Failed to create rule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteMutation.mutateAsync({ ruleId: id });
      toast.success("Rule deleted");
      refetch();
    } catch (err) {
      toast.error("Failed to delete rule");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#163022]" />
      </div>
    );
  }

  const rules = data?.pricingRules || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-[#163022] text-white px-4 py-2 rounded-xl hover:bg-[#0f241a] transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-6 text-[#163022]">New Pricing Rule</h3>
          <PricingRuleForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f9fafb] text-gray-500 font-bold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Service / Extra</th>
              <th className="px-6 py-4">Price / Rate</th>
              <th className="px-6 py-4">Time Impact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map((rule: any) => (
              <PricingRuleRow
                key={rule.id}
                rule={rule}
                onDelete={() => handleDelete(rule.id)}
                onUpdate={() => refetch()}
              />
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                  No pricing rules found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CouponsSection />
    </div>
  );
}

function PricingRuleRow({ rule, onDelete, onUpdate }: { rule: any, onDelete: () => void, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const trpc = useTRPC();
  const updateMutation = useMutation(trpc.updatePricingRule.mutationOptions());

  const handleUpdate = async (formData: any) => {
    try {
      await updateMutation.mutateAsync({ ruleId: rule.id, ...formData });
      toast.success("Rule updated");
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      toast.error("Failed to update rule");
    }
  };

  if (isEditing) {
    return (
      <tr>
        <td colSpan={8} className="p-4 bg-gray-50">
          <PricingRuleForm initialData={rule} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4 font-mono text-gray-400 font-bold">{rule.displayOrder}</td>
      <td className="px-6 py-4 font-bold text-gray-900">{rule.name}</td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
          {rule.ruleType.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-600">
        {rule.serviceType && <div className="text-xs font-bold uppercase tracking-wide text-gray-400">Service: {rule.serviceType}</div>}
        {rule.extraName && <div className="font-medium text-[#163022]">{rule.extraName}</div>}
      </td>
      <td className="px-6 py-4">
        {rule.priceAmount !== null && <div className="font-bold text-gray-900">${rule.priceAmount}</div>}
        {rule.ratePerUnit !== null && <div className="text-gray-600 font-medium">${rule.ratePerUnit} / unit</div>}
        {(rule.priceRangeMin !== null || rule.priceRangeMax !== null) && (
          <div className="text-xs text-gray-400 mt-1 font-medium">
            {rule.priceRangeMin ?? "0"} - {rule.priceRangeMax ?? "∞"}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600">
        {rule.timeAmount !== null && <div className="font-medium">{rule.timeAmount} hrs</div>}
        {rule.timePerUnit !== null && <div className="text-gray-500">{rule.timePerUnit} hrs/unit</div>}
      </td>
      <td className="px-6 py-4">
        {rule.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase">
            <Check className="w-3 h-3" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase">
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-[#163022] hover:bg-gray-100 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PricingRuleForm({ initialData, onSubmit, onCancel }: { initialData?: any, onSubmit: (data: any) => void, onCancel: () => void }) {
  const [type, setType] = useState(initialData?.ruleType || "BASE_PRICE");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const getNum = (name: string) => {
      const val = formData.get(name);
      return val ? Number(val) : null;
    };

    const data = {
      name: formData.get("name") as string,
      ruleType: formData.get("ruleType") as any,
      serviceType: formData.get("serviceType") as string || null,
      priceAmount: getNum("priceAmount"),
      ratePerUnit: getNum("ratePerUnit"),
      timeAmount: getNum("timeAmount"),
      timePerUnit: getNum("timePerUnit"),
      extraName: formData.get("extraName") as string || null,
      extraDescription: formData.get("extraDescription") as string || null,
      isActive: formData.get("isActive") === "on",
      displayOrder: getNum("displayOrder") || 0,
      priceRangeMin: getNum("priceRangeMin"),
      priceRangeMax: getNum("priceRangeMax"),
    };
    onSubmit(data);
  };

  const TYPES = ["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"];

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rule Name <span className="text-red-500">*</span></label>
        <input required name="name" defaultValue={initialData?.name} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" placeholder="e.g. Standard Cleaning Base" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rule Type</label>
        <select name="ruleType" value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium">
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Type (Optional)</label>
        <input name="serviceType" defaultValue={initialData?.serviceType} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" placeholder="e.g. standard, deep" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Display Order</label>
        <input type="number" name="displayOrder" defaultValue={initialData?.displayOrder || 0} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="form-group flex items-center pt-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="isActive" defaultChecked={initialData?.isActive ?? true} className="w-5 h-5 rounded border-gray-300 text-[#163022] focus:ring-[#163022]" />
          <span className="text-sm font-bold text-gray-700 group-hover:text-[#163022] transition-colors">Active Rule</span>
        </label>
      </div>

      <div className="col-span-full h-px bg-gray-100 my-2" />

      {/* Price Fields */}
      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Flat Price ($)</label>
        <input type="number" step="0.01" name="priceAmount" defaultValue={initialData?.priceAmount} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rate ($ per unit)</label>
        <input type="number" step="0.001" name="ratePerUnit" defaultValue={initialData?.ratePerUnit} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Price ($)</label>
        <input type="number" step="0.01" name="priceRangeMin" defaultValue={initialData?.priceRangeMin} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Price ($)</label>
        <input type="number" step="0.01" name="priceRangeMax" defaultValue={initialData?.priceRangeMax} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="col-span-full h-px bg-gray-100 my-2" />

      {/* Time Fields */}
      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Flat Time (Hours)</label>
        <input type="number" step="0.1" name="timeAmount" defaultValue={initialData?.timeAmount} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      <div className="form-group">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time Rate (Hours per unit)</label>
        <input type="number" step="0.01" name="timePerUnit" defaultValue={initialData?.timePerUnit} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
      </div>

      {type === 'EXTRA_SERVICE' && (
        <>
          <div className="col-span-full h-px bg-gray-100 my-2" />
          <div className="form-group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Extra Name</label>
            <input name="extraName" defaultValue={initialData?.extraName} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
          </div>
          <div className="form-group col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <input name="extraDescription" defaultValue={initialData?.extraDescription} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#163022] focus:outline-none transition-all text-sm font-medium" />
          </div>
        </>
      )}

      <div className="col-span-full flex justify-end gap-3 mt-6">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
        <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#163022] text-white hover:bg-[#0f241a] transition-colors shadow-lg shadow-[#163022]/20">Save Rule</button>
      </div>
    </form>
  );
}

// Keeping Billing as Mock for now
function BillingTab() {
  const [billing, setBilling] = useState<BillingConfig | null>(null);

  useEffect(() => {
    getBillingConfig().then(setBilling);
  }, []);

  if (!billing) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-lg font-semibold text-[#0f172a]">Billing Configuration</div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Payment Hold Delay (hours)
            <input
              type="number"
              value={billing.paymentHoldDelayHours}
              onChange={(e) =>
                setBilling((prev) => (prev ? { ...prev, paymentHoldDelayHours: Number(e.target.value) } : prev))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          {billing.notes.map((note, idx) => (
            <p key={idx} className="rounded-lg bg-[#f9fafb] px-3 py-2">
              {note}
            </p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => getBillingConfig().then(setBilling)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Reset
          </button>
          <button className="rounded-lg bg-[#163022] px-4 py-2 text-sm font-semibold text-white">
            Save Configuration
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-lg font-semibold text-[#0f172a]">Current Behavior</div>
        <p className="mt-2 text-sm text-gray-600">
          Holds are applied 24 hours before service start. Refunds and retried payments are stubbed until Stripe/Mercury are wired.
        </p>
        <div className="mt-3 grid gap-2 text-sm text-gray-700">
          <div className="rounded-lg bg-[#f9fafb] px-3 py-2">Example: Friday booking → hold Thursday 10am.</div>
          <div className="rounded-lg bg-[#f9fafb] px-3 py-2">Decline retry once per hour for 6 hours.</div>
          <div className="rounded-lg bg-[#f9fafb] px-3 py-2">Funds settle to Operating Checking (mock).</div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-lg font-semibold text-[#0f172a]">Availability & Working Hours</div>
        <p className="text-sm text-gray-600">Mock controls for cleaner default availability (Figure 10 style).</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
            <DayAvailability key={day} day={day} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DayAvailability({ day }: { day: string }) {
  const [enabled, setEnabled] = useState(day !== "Saturday" && day !== "Sunday");
  const [start, setStart] = useState("07:30");
  const [end, setEnd] = useState("17:00");

  return (
    <div className="rounded-xl border border-gray-200 bg-[#f9fafb] p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[#0f172a]">{day}</div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <span className="text-xs text-gray-500">{enabled ? "On" : "Off"}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
          />
        </label>
      </div>
      {enabled && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Start Time</label>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              type="time"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">End Time</label>
            <input
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              type="time"
            />
          </div>
          <button
            className="mt-6 rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-[#0f172a]"
            onClick={() => {
              setStart("07:30");
              setEnd("17:00");
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

function CouponsSection() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: coupons } = useQuery(trpc.marketing.getCoupons.queryOptions());
  const createMutation = useMutation(trpc.marketing.createCoupon.mutationOptions());
  const deleteMutation = useMutation(trpc.marketing.deleteCoupon.mutationOptions());
  const [isCreating, setIsCreating] = useState(false);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 font-heading tracking-tight">
        <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center"><Tag className="w-4 h-4" /></span>
        Coupons & Discounts
      </h3>

      <div className="space-y-3">
        {isCreating ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const code = fd.get("code") as string;
              const amount = parseFloat(fd.get("amount") as string);
              const type = fd.get("type") as "PERCENT" | "FIXED_AMOUNT";
              try {
                await createMutation.mutateAsync({ code, discountAmount: amount, discountType: type });
                toast.success("Coupon created");
                setIsCreating(false);
                queryClient.invalidateQueries({ queryKey: trpc.marketing.getCoupons.queryOptions().queryKey });
              } catch (err: any) { toast.error(err.message); }
            }}
            className="p-4 bg-pink-50/30 border border-pink-100 rounded-xl mb-4 animate-in slide-in-from-top-2"
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input name="code" placeholder="CODE (e.g. SUMMER20)" className="uppercase font-mono font-bold text-sm px-3 py-2 rounded-lg border border-gray-200" required />
              <select name="type" className="text-sm px-3 py-2 rounded-lg border border-gray-200">
                <option value="FIXED_AMOUNT">$ Fixed Off</option>
                <option value="PERCENT">% Off</option>
              </select>
              <input name="amount" type="number" placeholder="Amount" step="0.01" className="text-sm px-3 py-2 rounded-lg border border-gray-200" required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="text-xs font-bold text-gray-500 px-3 py-1.5">Cancel</button>
              <button type="submit" className="text-xs font-bold text-white bg-pink-600 px-3 py-1.5 rounded-lg">Save Coupon</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsCreating(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-pink-200 hover:text-pink-600 hover:bg-pink-50/30 transition-all mb-4">
            + Create New Coupon
          </button>
        )}

        {(coupons || []).map((coupon: any) => (
          <div key={coupon.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">{coupon.code}</div>
              <div className="text-sm font-semibold text-gray-700">
                {coupon.discountType === "PERCENT" ? `${coupon.discountAmount}% Off` : `$${coupon.discountAmount} Off`}
              </div>
            </div>
            <button onClick={async () => {
              if (!confirm("Delete coupon?")) return;
              await deleteMutation.mutateAsync({ id: coupon.id });
              queryClient.invalidateQueries({ queryKey: trpc.marketing.getCoupons.queryOptions().queryKey });
            }} className="text-gray-300 hover:text-red-500 transition-colors">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogSection() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: posts } = useQuery(trpc.marketing.getPosts.queryOptions());
  const createMutation = useMutation(trpc.marketing.createPost.mutationOptions());
  const deleteMutation = useMutation(trpc.marketing.deletePost.mutationOptions());
  const [isCreating, setIsCreating] = useState(false);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 font-heading tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Pencil className="w-4 h-4" /></span>
          Blog Posts
        </h3>
        <button onClick={() => setIsCreating(true)} className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-900/10 transition-all flex items-center gap-2">
          + New Post
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await createMutation.mutateAsync({
                title: fd.get("title") as string,
                slug: fd.get("slug") as string,
                content: fd.get("content") as string,
                isPublished: fd.get("isPublished") === "on"
              });
              toast.success("Post created");
              setIsCreating(false);
              queryClient.invalidateQueries({ queryKey: trpc.marketing.getPosts.queryOptions().queryKey });
            } catch (err: any) { toast.error(err.message); }
          }}
          className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-6 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo-900 uppercase">Title</label>
              <input name="title" className="w-full px-4 py-2 rounded-xl border border-indigo-200 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo-900 uppercase">Slug (URL)</label>
              <input name="slug" className="w-full px-4 py-2 rounded-xl border border-indigo-200 text-sm font-mono" placeholder="my-new-post" required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-900 uppercase">Content (Markdown)</label>
            <textarea name="content" rows={6} className="w-full px-4 py-2 rounded-xl border border-indigo-200 text-sm font-mono" required />
          </div>
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-bold text-indigo-900 cursor-pointer">
              <input type="checkbox" name="isPublished" className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
              Publish Immediately
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-100">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">Save Post</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(posts || []).map((post: any) => (
          <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="font-bold text-gray-900 flex items-center gap-2">
                {post.title}
                {post.isPublished ?
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded uppercase tracking-wider">Published</span> :
                  <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded uppercase tracking-wider">Draft</span>
                }
              </div>
              <div className="text-xs text-gray-500 font-mono mt-1">/blog/{post.slug}</div>
            </div>
            <button onClick={async () => {
              if (!confirm("Delete post?")) return;
              await deleteMutation.mutateAsync({ id: post.id });
              queryClient.invalidateQueries({ queryKey: trpc.marketing.getPosts.queryOptions().queryKey });
            }} className="text-gray-400 hover:text-red-500 p-2">
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(posts || []).length === 0 && !isCreating && <div className="text-center py-8 text-gray-400 text-sm">No blog posts yet.</div>}
      </div>
    </section>
  );
}

function LocationSection() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: locations } = useQuery(trpc.marketing.getLocationPages.queryOptions());
  const createMutation = useMutation(trpc.marketing.createLocationPage.mutationOptions());
  const deleteMutation = useMutation(trpc.marketing.deleteLocationPage.mutationOptions());
  const [isCreating, setIsCreating] = useState(false);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 font-heading tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
          Location Pages
        </h3>
        <button onClick={() => setIsCreating(true)} className="text-sm font-bold bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-900/10 transition-all flex items-center gap-2">
          + Add Location
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            try {
              await createMutation.mutateAsync({
                city: fd.get("city") as string,
                slug: fd.get("slug") as string,
              });
              toast.success("Location page created");
              setIsCreating(false);
              queryClient.invalidateQueries({ queryKey: trpc.marketing.getLocationPages.queryOptions().queryKey });
            } catch (err: any) { toast.error(err.message); }
          }}
          className="p-4 bg-orange-50 rounded-xl mb-4 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="text-xs font-bold text-orange-900 uppercase block mb-1">City Name</label>
            <input name="city" placeholder="e.g. Ann Arbor" className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm" required />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-orange-900 uppercase block mb-1">Slug</label>
            <input name="slug" placeholder="ann-arbor" className="w-full px-3 py-2 rounded-lg border border-orange-200 text-sm font-mono" required />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 h-[38px]">Save</button>
          <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-orange-600 hover:bg-orange-100 h-[38px]">Cancel</button>

        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(locations || []).map((loc: any) => (
          <div key={loc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all">
            <div>
              <div className="font-bold text-gray-900">{loc.city}</div>
              <div className="text-[10px] text-gray-500 font-mono">/locations/{loc.slug}</div>
            </div>
            <button onClick={async () => {
              if (!confirm("Delete location page?")) return;
              await deleteMutation.mutateAsync({ id: loc.id });
              queryClient.invalidateQueries({ queryKey: trpc.marketing.getLocationPages.queryOptions().queryKey });
            }} className="text-gray-300 hover:text-red-500 p-1">
              <Trash className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
