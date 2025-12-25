import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Pencil, Plus, Trash2, UserPlus, CheckSquare, Square, ChevronDown, ShieldCheck, Eye, Key, CreditCard, Calendar, X, Mail, Phone, Lock } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type Tab = "customers" | "cleaners" | "admins";

export const Route = createFileRoute("/admin-portal/management")({
  component: ManagementPage,
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    return {
      tab: (search.tab as Tab) || "customers",
    };
  },
});

interface FormState {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

import { useAuthStore } from "~/stores/authStore";

// ...

function ManagementPage() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: Route.id });
  const tab = search.tab || "customers";
  const { user } = useAuthStore();

  const setTab = (t: Tab) => {
    navigate({ search: { tab: t } });
  };

  const roleMap: Record<Tab, "CLIENT" | "CLEANER" | "ADMIN" | "OWNER"> = {
    customers: "CLIENT",
    cleaners: "CLEANER",
    admins: "ADMIN",
  };

  const usersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({ role: roleMap[tab] }));
  const users = usersQuery.data?.users || [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", role: "" });

  // Mutations
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

  const openDetail = (user: any) => {
    setDetailUser(user);
    setShowDetailModal(true);
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
      title={`Hello, ${user?.firstName || 'Admin'}!`}
      subtitle={`Manage your ${tab} list.`}
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
            {tab === 'cleaners' ? <UserPlus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Create {activeLabel}
          </button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-6">

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 capitalize">{tab} ({users.length})</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="w-10 px-6 py-4">
                  <button onClick={toggleAll}>
                    {selectedIds.size === users.length && users.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#163022]" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-300" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => toggleOne(user.id)}>
                      {selectedIds.has(user.id) ? (
                        <CheckSquare className="h-4 w-4 text-[#163022]" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#0f172a]">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-gray-600">{user.phone || "—"}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openDetail(user)}
                        className="p-2 text-gray-400 hover:text-[#163022] hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal("edit", user)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Loading {tab}...
                  </td>
                </tr>
              )}
              {!usersQuery.isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    No {tab} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal (Slide-over style) */}
      {showDetailModal && detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#163022] text-white flex items-center justify-center font-bold text-lg">
                  {detailUser.firstName?.[0]}{detailUser.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detailUser.firstName} {detailUser.lastName}</h2>
                  <p className="text-sm text-gray-500">{detailUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">

              {/* Customer Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                    <div className="text-sm text-gray-700 font-medium">{detailUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label>
                    <div className="text-sm text-gray-700 font-medium">{detailUser.phone || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                    <div className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                      {detailUser.role}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Joined</label>
                    <div className="text-sm text-gray-700">{new Date(detailUser.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Temporary Password (Yellow Box) */}
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" /> Temporary Password (Admin View Only)
                </h3>
                <div className="bg-white border border-amber-200 rounded-lg px-4 py-2 font-mono text-amber-800 font-bold inline-block mb-2">
                  VerdeLuxeTemp123!
                </div>
                <p className="text-xs text-amber-700">
                  This password was auto-generated. The customer can change it via 'Forgot Password' on the login page.
                </p>
              </div>

              {/* Saved Payment Methods */}
              {tab === 'customers' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Saved Payment Methods
                  </h3>
                  <div className="space-y-3">
                    {/* Mock Payment Methods */}
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                          <span className="font-bold text-[10px] text-gray-600">VISA</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">Visa •••• 4242</div>
                          <div className="text-xs text-gray-500">Expires 12/2028</div>
                        </div>
                      </div>
                      <button className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Bookings</div>
                  <div className="text-2xl font-bold text-gray-900">11</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Completed</div>
                  <div className="text-2xl font-bold text-emerald-600">11</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Spent</div>
                  <div className="text-2xl font-bold text-gray-900">$4,835.00</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal (Existing) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#163022]">
                  {editId ? "Edit" : "Create"} {activeLabel}
                </h2>
                <p className="text-sm text-gray-500">Enter details below</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              {(tab === "customers" || tab === "cleaners") && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:bg-white focus:outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </>
              )}

              {tab === "admins" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role <span className="text-red-500">*</span></label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium focus:border-[#163022] focus:outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Permissions</label>
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {[
                        { key: "manage_bookings", label: "Bookings" },
                        { key: "manage_customers", label: "Customers" },
                        { key: "manage_cleaners", label: "Cleaners" },
                        { key: "manage_accounting", label: "Accounting" },
                        { key: "view_reports", label: "Reports" },
                        { key: "manage_settings", label: "Settings" },
                      ].map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!form.permissions?.[p.key]}
                            onChange={(e) => setForm(f => ({
                              ...f,
                              permissions: { ...f.permissions, [p.key]: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-[#163022] py-3 text-sm font-bold text-white shadow-lg shadow-[#163022]/20 hover:bg-[#0f241a] transition-all"
                >
                  {editId ? 'Update' : 'Create'} User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
