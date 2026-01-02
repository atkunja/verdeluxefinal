import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "~/components/admin/AdminShell";
import { Plus, Pencil, Trash2, X, CheckSquare, Square, UserPlus, ShieldCheck, Eye, Key, CreditCard, Users, UserCog, Briefcase, Lock } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "~/stores/authStore";
import { AdminUserForm } from "~/components/AdminUserForm";
import { useAdminPermissions } from "~/hooks/useAdminPermissions";

type Tab = "customers" | "cleaners" | "admins";

export const Route = createFileRoute("/admin-portal/management")({
  component: ManagementPage,
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    return {
      tab: (search.tab as Tab) || undefined,
    };
  },
});

function ManagementPage() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: Route.id });
  const { user, setAuth, token } = useAuthStore();
  const { hasPermission, role, isLoading: isPermissionsLoading } = useAdminPermissions();
  const currentUser = user;

  const tabs = useMemo(() => {
    const list = [];
    if (hasPermission("manage_customers")) {
      list.push({ id: "customers" as const, label: "Customers", icon: Users });
    }
    if (hasPermission("manage_cleaners")) {
      list.push({ id: "cleaners" as const, label: "Cleaners", icon: Briefcase });
    }
    if (hasPermission("manage_admins")) {
      list.push({ id: "admins" as const, label: "Admins", icon: ShieldCheck });
    }
    return list;
  }, [hasPermission]);

  // Handle default tab selection
  const tab = useMemo(() => {
    if (search.tab && tabs.some(t => t.id === search.tab)) return search.tab;
    return tabs[0]?.id;
  }, [search.tab, tabs]);

  useEffect(() => {
    if (!isPermissionsLoading && tabs.length > 0 && (!search.tab || !tabs.some(t => t.id === search.tab))) {
      navigate({ search: { tab: tabs[0].id } as any });
    }
  }, [isPermissionsLoading, tabs, search.tab, navigate]);

  const setTab = (t: Tab) => {
    navigate({ search: { tab: t } as any });
  };

  const roleMap: Record<Tab, "CLIENT" | "CLEANER" | ["ADMIN", "OWNER"]> = {
    customers: "CLIENT",
    cleaners: "CLEANER",
    admins: ["ADMIN", "OWNER"],
  };

  const usersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions(
    { role: roleMap[tab] as any },
    { enabled: !!tab }
  ));
  const users = usersQuery.data?.users || [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
      setSelectedUser(user);
    } else {
      setEditId(null);
      setSelectedUser(undefined);
    }
    setShowModal(true);
  };

  const openDetail = (user: any) => {
    setDetailUser(user);
    setShowDetailModal(true);
  };



  const handleSave = async (data: any) => {
    try {
      if (editId) {
        const res = await updateMutation.mutateAsync({
          userId: editId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role as any,
          adminPermissions: data.adminPermissions,
          color: data.color || null,
          temporaryPassword: data.temporaryPassword,
          password: data.password ? data.password : undefined,
        });

        // If editing self, update the auth store to reflect changes immediately (e.g. permissions)
        if (currentUser && currentUser.id === editId && token) {
          // We need to match the User type expected by store. res.user has what we selected.
          setAuth(token, res.user as any);
        }
      } else {
        await createMutation.mutateAsync({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role as any,
          phone: data.phone,
          adminPermissions: data.adminPermissions,
          password: data.password || "VerdeLuxeTemp123!",
          color: data.color,
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


  if (!isPermissionsLoading && tabs.length === 0) {
    return (
      <AdminShell title="User Management" subtitle="Manage your accounts and permissions">
        <div className="premium-card py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-xl font-black text-slate-900">Access Denied</p>
          <p className="text-slate-400 mt-2 max-w-sm mx-auto">
            You do not have permission to view any management tabs. Please contact an owner to adjust your permissions.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (!tab) return null;

  return (
    <AdminShell
      title="User Management"
      subtitle={`Manage your ${tab} accounts and permissions`}
      actions={
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="h-10 px-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => openModal("create")}
            className="h-10 px-5 rounded-xl bg-[#163022] text-white text-xs font-bold shadow-lg hover:bg-[#264e3c] transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {activeLabel}
          </button>
        </div>
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`premium-card !p-5 text-left transition-all ${tab === t.id ? "ring-2 ring-[#163022] ring-offset-2" : ""
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {users.length}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tab === t.id ? "bg-[#163022] text-white" : "bg-slate-100 text-slate-400"
                }`}>
                <t.icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="premium-card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
            {tab} ({users.length})
          </h3>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="w-12 px-6 py-4">
                <button onClick={toggleAll} className="flex items-center justify-center">
                  {selectedIds.size === users.length && users.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-[#163022]" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <button onClick={() => toggleOne(u.id)} className="flex items-center justify-center">
                    {selectedIds.has(u.id) ? (
                      <CheckSquare className="h-4 w-4 text-[#163022]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#163022] to-[#264e3c] text-white flex items-center justify-center font-bold text-xs">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="font-bold text-slate-900">
                      {u.firstName} {u.lastName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">{u.email}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{u.phone || "—"}</td>
                <td className="px-6 py-5 text-xs font-medium text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openDetail(u)}
                      className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#163022] hover:bg-slate-200 transition-all"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal("edit", u)}
                      className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-all"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usersQuery.isLoading && (
          <div className="py-20 text-center">
            <div className="h-8 w-8 border-2 border-slate-200 border-t-[#163022] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading {tab}...</p>
          </div>
        )}

        {!usersQuery.isLoading && users.length === 0 && (
          <div className="py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900">No {tab} found</p>
            <p className="text-slate-400 mt-1">Create your first {activeLabel.toLowerCase()} to get started</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#163022] to-[#264e3c] text-white flex items-center justify-center font-bold text-lg">
                  {detailUser.firstName?.[0]}{detailUser.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{detailUser.firstName} {detailUser.lastName}</h2>
                  <p className="text-sm text-slate-500">{detailUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="h-10 w-10 rounded-xl bg-white hover:bg-slate-100 transition-colors flex items-center justify-center">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Info Card */}
              <div className="premium-card">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserCog className="h-4 w-4" /> User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                    <div className="text-sm font-medium text-slate-900">{detailUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                    <div className="text-sm font-medium text-slate-900">{detailUser.phone || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                    <span className="inline-flex px-2 py-1 rounded-lg bg-[#163022] text-white text-[10px] font-bold uppercase">
                      {detailUser.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Joined</label>
                    <div className="text-sm font-medium text-slate-900">{new Date(detailUser.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Temp Password */}
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" /> Temporary Password
                </h3>
                <div className="bg-white border border-amber-200 rounded-xl px-4 py-2 font-mono text-amber-800 font-bold inline-block mb-2">
                  VerdeLuxeTemp123!
                </div>
                <p className="text-xs text-amber-600">
                  Customer can reset via "Forgot Password" on login page.
                </p>
              </div>

              {/* Payment Methods */}
              {tab === 'customers' && (
                <div className="premium-card">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Methods
                  </h3>
                  <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-12 bg-white border border-slate-200 rounded flex items-center justify-center">
                        <span className="font-bold text-[10px] text-slate-600">VISA</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Visa •••• 4242</div>
                        <div className="text-xs text-slate-500">Expires 12/2028</div>
                      </div>
                    </div>
                    <button className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="premium-card !p-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bookings</div>
                  <div className="text-2xl font-black text-slate-900">11</div>
                </div>
                <div className="premium-card !p-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Completed</div>
                  <div className="text-2xl font-black text-emerald-600">11</div>
                </div>
                <div className="premium-card !p-4 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Spent</div>
                  <div className="text-2xl font-black text-[#163022]">$4,835</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <AdminUserForm
          user={selectedUser}
          onSubmit={handleSave}
          onCancel={() => setShowModal(false)}
          isSubmitting={updateMutation.isPending || createMutation.isPending}
        />
      )}
    </AdminShell>
  );
}
