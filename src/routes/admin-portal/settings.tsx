import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminShell } from "~/components/admin/AdminShell";
import {
  BillingConfig,
  ChecklistTemplate,
  BasePriceRule,
} from "~/mocks/adminPortal";
import {
  getBillingConfig,
  listBasePriceRules,
  listChecklistTemplates,
} from "~/api/adminPortal";
import { Pencil, Plus, Trash } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type SettingsTab = "checklist" | "pricing" | "billing" | "website" | "leadSources";

export const Route = createFileRoute("/admin-portal/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SettingsTab>("checklist");

  const leadSourcesQuery = useQuery(trpc.crm.getLeadSources.queryOptions());
  const createLeadSourceMutation = useMutation(trpc.crm.createLeadSource.mutationOptions());
  const deleteLeadSourceMutation = useMutation(trpc.crm.deleteLeadSource.mutationOptions());
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [rules, setRules] = useState<BasePriceRule[]>([]);
  const [billing, setBilling] = useState<BillingConfig | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [activeRule, setActiveRule] = useState<BasePriceRule | null>(null);

  useEffect(() => {
    listChecklistTemplates().then(setTemplates);
    listBasePriceRules().then(setRules);
    getBillingConfig().then(setBilling);
  }, []);

  const groupedTemplates = useMemo(() => {
    return templates.reduce<Record<string, ChecklistTemplate[]>>((acc, template) => {
      const type = (template.serviceType || "OTHER") as string;
      if (!acc[type]) acc[type] = [];
      acc[type]!.push(template);
      return acc;
    }, {});
  }, [templates]);

  const saveRule = () => {
    if (!activeRule) return;
    if (rules.find((r) => r.id === activeRule.id)) {
      setRules((prev) => prev.map((r) => (r.id === activeRule.id ? activeRule : r)));
    } else {
      setRules((prev) => [...prev, { ...activeRule, id: `BP-${Date.now()}` }]);
    }
    setActiveRule(null);
    setShowRuleModal(false);
  };

  return (
    <AdminShell
      title="Settings"
      subtitle="Checklist templates, pricing, billing."
      actions={
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 text-sm">
          {(["checklist", "pricing", "billing", "website", "leadSources"] as SettingsTab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`rounded-lg px-3 py-1.5 font-semibold ${tab === tabKey ? "bg-[#163022] text-white" : "text-gray-700"
                }`}
            >
              {(tabKey[0] ?? "").toUpperCase() + tabKey.slice(1)}
            </button>
          ))}
        </div>
      }
    >
      {tab === "checklist" && (
        <div className="space-y-4">
          {Object.entries(groupedTemplates).map(([serviceType, group]) => (
            <div key={serviceType} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold text-[#0f172a]">{serviceType}</div>
                <button
                  onClick={() =>
                    setTemplates((prev) => [
                      ...prev,
                      {
                        id: `CT-${Date.now()}`,
                        name: "New Template",
                        serviceType: serviceType as ChecklistTemplate["serviceType"],
                        items: ["Add details..."],
                      },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Template
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.map((template) => (
                  <article key={template.id} className="rounded-xl border border-gray-200 bg-[#f9fafb] p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[#0f172a]">{template.name}</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (!window.confirm("Delete template?")) return;
                            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
                          }}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
                      {template.items.slice(0, 4).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {template.items.length > 4 && (
                        <li className="text-xs text-gray-500">
                          +{template.items.length - 4} more
                        </li>
                      )}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "pricing" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-[#0f172a]">Base Price</div>
                <div className="text-sm text-gray-500">Mock rule list</div>
              </div>
              <button
                onClick={() => {
                  setActiveRule({ id: "", label: "", amount: 0, condition: "" });
                  setShowRuleModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#163022] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Add Rule
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-2">
                  <div>
                    <div className="font-semibold text-[#0f172a]">{rule.label}</div>
                    <div className="text-xs text-gray-500">{rule.condition}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-[#0f172a]">${rule.amount.toFixed(0)}</div>
                    <button
                      onClick={() => {
                        setActiveRule(rule);
                        setShowRuleModal(true);
                      }}
                      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {["Square Footage Rate", "Bedroom Rate", "Bathroom Rate", "Extra Services", "Time Estimate"].map((section) => (
            <section key={section} className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-[#0f172a]">{section}</div>
                  <div className="text-sm text-gray-500">0 rules</div>
                </div>
                <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                  Add Rule
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">Skeleton placeholder.</p>
            </section>
          ))}
        </div>
      )}

      {tab === "billing" && billing && (
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
      )}

      {tab === "website" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">SEO</span>
              SEO & Meta Tags
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Site Title</label>
                <input
                  type="text"
                  defaultValue="V-Luxe Cleaning | Premium Residential Cleaning"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Meta Keywords</label>
                <input
                  type="text"
                  defaultValue="cleaning, luxury, residential, maid service, house cleaning"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-gray-700">Meta Description</label>
                <textarea
                  rows={2}
                  defaultValue="V-Luxe provides premium residential cleaning services with a focus on quality, reliability, and luxury experience."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                Update SEO
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">FAQ</span>
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {[
                { q: "Do you bring your own supplies?", a: "Yes, we provide all eco-friendly cleaning supplies and professional equipment." },
                { q: "What is your cancellation policy?", a: "Cancellations must be made at least 24 hours in advance to avoid a fee." },
              ].map((faq, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 group relative">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      defaultValue={faq.q}
                      className="bg-transparent font-bold text-gray-900 outline-none w-full border-none p-0 focus:ring-0"
                    />
                    <button className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    defaultValue={faq.a}
                    className="bg-transparent text-sm text-gray-600 outline-none w-full border-none p-0 focus:ring-0 resize-none"
                  />
                </div>
              ))}
              <button className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 font-heading tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">LGL</span>
              Legal & Policy Pages
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Privacy Policy (Markdown/HTML)</label>
                <textarea
                  rows={6}
                  defaultValue="# Privacy Policy\n\nYour privacy is important to us..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Terms of Service (Markdown/HTML)</label>
                <textarea
                  rows={6}
                  defaultValue="# Terms of Service\n\nBy using our services, you agree..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-bold text-white shadow-lg hover:scale-[1.02] transition-transform">
                Save Legal Documents
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "leadSources" && (
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
                  className="rounded-xl bg-[#163022] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {((leadSourcesQuery.data as any) || []).map((source: any) => (
                <div key={source.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
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

      {showRuleModal && activeRule && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold text-[#0f172a]">
                {activeRule.id ? "Edit" : "Add"} Base Price Rule
              </div>
              <button className="text-sm text-gray-500" onClick={() => setShowRuleModal(false)}>
                Close
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-sm text-gray-700">
                Label
                <input
                  value={activeRule.label}
                  onChange={(e) => setActiveRule((r) => (r ? { ...r, label: e.target.value } : r))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-gray-700">
                Amount
                <input
                  type="number"
                  value={activeRule.amount}
                  onChange={(e) => setActiveRule((r) => (r ? { ...r, amount: Number(e.target.value) } : r))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-gray-700">
                Condition
                <input
                  value={activeRule.condition}
                  onChange={(e) => setActiveRule((r) => (r ? { ...r, condition: e.target.value } : r))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRule}
                  className="rounded-lg bg-[#163022] px-4 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
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
            Copy to All Days
          </button>
        </div>
      )}
    </div>
  );
}
