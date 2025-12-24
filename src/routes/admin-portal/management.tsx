import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Pencil, Plus, Trash2, UserPlus, CheckSquare, Square, ChevronDown, ShieldCheck } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type Tab = "customers" | "cleaners" | "admins";

export const Route = createFileRoute("/admin-portal/management")({
  component: ManagementPage,
});

interface FormState {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

function ManagementPage() {
  const trpc = useTRPC();
  const [tab, setTab] = useState<Tab>("customers");

  const roleMap: Record<Tab, "CLIENT" | "CLEANER" | "ADMIN" | "OWNER"> = {
    customers: "CLIENT",
    cleaners: "CLEANER",
    admins: "ADMIN",
  };

  const usersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({ role: roleMap[tab] }));
  const users = usersQuery.data?.users || [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", role: "" });

  const deleteMutation = useMutation(trpc.deleteUserAdmin.mutationOptions({
    onSuccess: () => {
      toast.success("User deleted");
      usersQuery.refetch();
    }
  }));

  const bulkDeleteMutation = useMutation(trpc.bulk.bulkDeleteUsers.mutationOptions({
    onSuccess: () => {
      toast.success("Users deleted");
      setSelectedIds(new Set());
      usersQuery.refetch();
    }
  }));

  const updateMutation = useMutation(trpc.updateUserAdmin.mutationOptions({
    onSuccess: () => {
      toast.success("User updated");
      setShowModal(false);
      usersQuery.refetch();
    }
  }));

  const createMutation = useMutation(trpc.createUserAdmin.mutationOptions({
    onSuccess: () => {
      toast.success("User created");
      setShowModal(false);
      usersQuery.refetch();
    }
  }));

  const activeLabel = useMemo(() => {
    if (tab === "customers") return "Customer";
    if (tab === "cleaners") return "Cleaner";
    return "Admin";
  }, [tab]);


  const toggleAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} users?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync({ userIds: Array.from(selectedIds) });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openModal = (mode: "create" | "edit", user?: any) => {
    if (mode === "edit" && user) {
      setEditId(user.id);
      setForm({
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        permissions: (user.adminPermissions as any) || {}
      });
    } else {
      setEditId(null);
      setForm({ name: "", email: "", phone: "", role: roleMap[tab], permissions: {} });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and Email are required");
      return;
    }
    const [firstName, ...lastNameParts] = form.name.split(" ");
    const lastName = lastNameParts.join(" ");

    try {
      if (editId) {
        await updateMutation.mutateAsync({
          userId: editId,
          firstName,
          lastName,
          email: form.email,
          phone: form.phone,
          role: form.role as any,
          adminPermissions: form.permissions,
        });
      } else {
        await createMutation.mutateAsync({
          firstName,
          lastName,
          email: form.email,
          phone: form.phone,
          role: form.role as any,
          adminPermissions: form.permissions,
          password: "VerdeLuxeTemp123!", // Default temp password
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteMutation.mutateAsync({ userId: id });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminShell
      title="Management"
      subtitle="Customers, cleaners, and admins."
      actions={
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 border border-red-100 shadow-sm transition-all hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => openModal("create")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#163022] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0f241a]"
          >
            <UserPlus className="h-4 w-4" />
            Create {activeLabel}
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1">
        {(["customers", "cleaners", "admins"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === tabKey ? "bg-[#163022] text-white" : "text-gray-700"
              }`}
          >
            {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-[#f9fafb] text-xs font-semibold text-gray-600">
            <tr>
              <th className="w-10 px-4 py-3">
                <button onClick={toggleAll}>
                  {selectedIds.size === users.length && users.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Joined / Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3">
                  <button onClick={() => toggleOne(user.id)}>
                    {selectedIds.has(user.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 font-semibold text-[#0f172a]">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                <td className="px-4 py-3 text-gray-700">{user.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()} {tab === "admins" && `• ${user.role}`}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  <ActionButtons
                    onEdit={() => openModal("edit", user)}
                    onDelete={() => handleDelete(user.id)}
                  />
                </td>
              </tr>
            ))}
            {usersQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                  Loading {tab}...
                </td>
              </tr>
            )}
            {!usersQuery.isLoading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                  No {tab} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-[#0f172a]">
                  {editId ? "Edit" : "Create"} {activeLabel}
                </div>
                <div className="text-xs text-gray-500">Save to mock store</div>
              </div>
              <button className="text-sm text-gray-500" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              {(tab === "customers" || tab === "cleaners") && (
                <>
                  <label className="block text-sm text-gray-700">
                    Email
                    <input
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Phone
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}
              {tab === "admins" && (
                <div className="space-y-3">
                  <label className="block text-sm text-gray-700">
                    Role
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </label>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Granular Permissions
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "manage_bookings", label: "Bookings" },
                        { key: "manage_customers", label: "Customers" },
                        { key: "manage_cleaners", label: "Cleaners" },
                        { key: "manage_accounting", label: "Accounting" },
                        { key: "view_reports", label: "Reports" },
                        { key: "manage_settings", label: "Settings" },
                      ].map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-[#0f172a]">
                          <input
                            type="checkbox"
                            checked={!!form.permissions?.[p.key]}
                            onChange={(e) => setForm(f => ({
                              ...f,
                              permissions: { ...f.permissions, [p.key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-[#163022] px-4 py-2 text-sm font-semibold text-white shadow"
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

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onEdit} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
