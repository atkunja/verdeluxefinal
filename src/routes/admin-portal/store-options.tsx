import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X, ClipboardList, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/admin-portal/store-options")({
    component: StoreOptionsPage,
    validateSearch: (search: Record<string, unknown>): { tab: "pricing" | "checklist" } => {
        return {
            tab: (search.tab as "pricing" | "checklist") || "pricing",
        };
    },
});

function StoreOptionsPage() {
    const navigate = useNavigate();
    const search = useSearch({ from: Route.id });
    const tab = search.tab;

    const setTab = (t: "pricing" | "checklist") => {
        navigate({ search: { tab: t } });
    };

    return (
        <AdminShell
            title="Store Options"
            subtitle="Manage your pricing and checklist rules."
        >
            <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1 w-fit">
                <button
                    onClick={() => setTab("checklist")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "checklist" ? "bg-[#163022] text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                    <ClipboardList className="h-4 w-4" /> Checklist Rules
                </button>
                <button
                    onClick={() => setTab("pricing")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "pricing" ? "bg-[#163022] text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                    <DollarSign className="h-4 w-4" /> Pricing Rules
                </button>
            </div>

            {tab === 'pricing' && <PricingTab />}
            {tab === 'checklist' && <ChecklistTab />}
        </AdminShell>
    );
}

function ChecklistTab() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Checklist Configuration</h3>
            <p className="text-gray-500 max-w-md mx-auto">
                Dynamic checklist configuration is coming soon. Currently, checklists are managed in the code repository.
            </p>
        </div>
    );
}

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
