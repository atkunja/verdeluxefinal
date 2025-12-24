
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/admin-portal/pricing")({
    component: PricingPage,
});

function PricingPage() {
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const trpc = useTRPC();

    const { data, isLoading, refetch } = useQuery(trpc.getPricingRules.queryOptions());
    const createMutation = useMutation(trpc.createPricingRule.mutationOptions());
    const updateMutation = useMutation(trpc.updatePricingRule.mutationOptions());
    const deleteMutation = useMutation(trpc.deletePricingRule.mutationOptions());

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Helper to get number or null
        const getNum = (name: string) => {
            const val = formData.get(name);
            return val ? Number(val) : null;
        };

        try {
            await createMutation.mutateAsync({
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
            });
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
            <AdminShell title="Pricing Rules">
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminShell>
        );
    }

    const rules = data?.pricingRules || [];

    return (
        <AdminShell title="Pricing Rules">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Pricing Configuration</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Rule
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold mb-4">New Pricing Rule</h3>
                        <PricingRuleForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
                    </div>
                )}

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Service / Extra</th>
                                <th className="px-4 py-3">Price / Rate</th>
                                <th className="px-4 py-3">Time Impact</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
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
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No pricing rules found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminShell>
    );
}

function PricingRuleRow({ rule, onDelete, onUpdate }: { rule: any, onDelete: () => void, onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const trpc = useTRPC();
    const updateMutation = useMutation(trpc.updatePricingRule.mutationOptions());

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const getNum = (name: string) => {
            const val = formData.get(name);
            return val ? Number(val) : null;
        };

        try {
            await updateMutation.mutateAsync({
                ruleId: rule.id,
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
            });
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
            <td className="px-4 py-3 font-mono text-gray-500">{rule.displayOrder}</td>
            <td className="px-4 py-3 font-medium">{rule.name}</td>
            <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                    {rule.ruleType}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-600">
                {rule.serviceType && <div className="text-xs uppercase tracking-wide text-gray-400">Service: {rule.serviceType}</div>}
                {rule.extraName && <div className="font-medium">{rule.extraName}</div>}
            </td>
            <td className="px-4 py-3">
                {rule.priceAmount !== null && <div className="font-medium">${rule.priceAmount}</div>}
                {rule.ratePerUnit !== null && <div className="text-gray-600">${rule.ratePerUnit} / unit</div>}
                {(rule.priceRangeMin !== null || rule.priceRangeMax !== null) && (
                    <div className="text-xs text-gray-400 mt-1">
                        Range: {rule.priceRangeMin ?? "0"} - {rule.priceRangeMax ?? "∞"}
                    </div>
                )}
            </td>
            <td className="px-4 py-3 text-gray-600">
                {rule.timeAmount !== null && <div>{rule.timeAmount} hrs</div>}
                {rule.timePerUnit !== null && <div>{rule.timePerUnit} hrs/unit</div>}
            </td>
            <td className="px-4 py-3">
                {rule.isActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <Check className="w-3 h-3" /> Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
                        Inactive
                    </span>
                )}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-primary transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function PricingRuleForm({ initialData, onSubmit, onCancel }: { initialData?: any, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, onCancel: () => void }) {
    const [type, setType] = useState(initialData?.ruleType || "BASE_PRICE");

    // Simple mapping for demonstration
    const TYPES = ["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE", "EXTRA_SERVICE", "TIME_ESTIMATE"];

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full flex justify-between">
                <h4 className="font-bold text-gray-800">Rule Details</h4>
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rule Name</label>
                <input required name="name" defaultValue={initialData?.name} className="w-full px-3 py-2 border rounded text-sm" placeholder="e.g. Standard Cleaning Base" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rule Type</label>
                <select name="ruleType" value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Service Type (Optional)</label>
                <input name="serviceType" defaultValue={initialData?.serviceType} className="w-full px-3 py-2 border rounded text-sm" placeholder="e.g. standard, deep" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Display Order</label>
                <input type="number" name="displayOrder" defaultValue={initialData?.displayOrder || 0} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="form-group flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" defaultChecked={initialData?.isActive ?? true} />
                    <span className="text-sm font-medium text-gray-700">Is Active?</span>
                </label>
            </div>

            <div className="col-span-full h-px bg-gray-100 my-2" />

            {/* Price Fields */}
            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Flat Price ($)</label>
                <input type="number" step="0.01" name="priceAmount" defaultValue={initialData?.priceAmount} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rate ($ per unit)</label>
                <input type="number" step="0.001" name="ratePerUnit" defaultValue={initialData?.ratePerUnit} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min Price ($)</label>
                <input type="number" step="0.01" name="priceRangeMin" defaultValue={initialData?.priceRangeMin} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max Price ($)</label>
                <input type="number" step="0.01" name="priceRangeMax" defaultValue={initialData?.priceRangeMax} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="col-span-full h-px bg-gray-100 my-2" />

            {/* Time Fields */}
            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Flat Time (Hours)</label>
                <input type="number" step="0.1" name="timeAmount" defaultValue={initialData?.timeAmount} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            <div className="form-group">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Time Rate (Hours per unit)</label>
                <input type="number" step="0.01" name="timePerUnit" defaultValue={initialData?.timePerUnit} className="w-full px-3 py-2 border rounded text-sm" />
            </div>

            {type === 'EXTRA_SERVICE' && (
                <>
                    <div className="col-span-full h-px bg-gray-100 my-2" />
                    <div className="form-group">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Extra Name</label>
                        <input name="extraName" defaultValue={initialData?.extraName} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div className="form-group col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                        <input name="extraDescription" defaultValue={initialData?.extraDescription} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                </>
            )}

            <div className="col-span-full flex justify-end gap-3 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-black">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark">Save Rule</button>
            </div>
        </form>
    );
}

