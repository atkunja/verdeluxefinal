import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import { Loader2, Plus, Pencil, Trash2, Check, X, ClipboardList, DollarSign, Trash, Save, Globe } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";
import { BillingConfig } from "~/mocks/adminPortal"; // Keeping Billing mock for now
import { getBillingConfig } from "~/api/adminPortal";

type SettingsTab = "checklist" | "pricing" | "billing" | "website" | "leadSources";

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
    navigate({ search: { tab: t } });
  };

  const leadSourcesQuery = useQuery(trpc.crm.getLeadSources.queryOptions());
  const createLeadSourceMutation = useMutation(trpc.crm.createLeadSource.mutationOptions());
  const deleteLeadSourceMutation = useMutation(trpc.crm.deleteLeadSource.mutationOptions());

  const tabs = [
    { id: "checklist" as const, label: "Checklists", icon: ClipboardList },
    { id: "pricing" as const, label: "Pricing", icon: DollarSign },
    { id: "website" as const, label: "Website", icon: Globe },
    { id: "leadSources" as const, label: "Lead Sources", icon: Plus },
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
      {tab === "leadSources" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Lead Sources Content (Unchanged) */}
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
      )}
    </AdminShell>
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
                          await deleteMutation.mutateAsync({ id: template.id });
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
    </div>
  );
}

// Pricing Tab Logic (Reused from previous step)
function PricingTab() {
  const [isCreating, setIsCreating] = useState(false);
  const trpc = useTRPC();

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
    <div>
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
            {rules.map((rule) => (
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
