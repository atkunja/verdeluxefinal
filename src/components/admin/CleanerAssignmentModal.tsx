import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, Search, Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { toast } from "react-hot-toast";

interface CleanerAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number | null;
    currentCleanerIds: number[];
}

export function CleanerAssignmentModal({ isOpen, onClose, bookingId, currentCleanerIds }: CleanerAssignmentModalProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<number[]>(currentCleanerIds);
    const [search, setSearch] = useState("");

    const cleanersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({ role: "CLEANER" }));
    const assignMutation = useMutation(trpc.assignCleaners.mutationOptions());

    const filteredCleaners = cleanersQuery.data?.users.filter(u =>
    (u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    const toggleCleaner = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAssign = async () => {
        if (!bookingId) return;
        try {
            await assignMutation.mutateAsync({
                bookingId,
                cleanerIds: selectedIds,
                status: "CONFIRMED"
            });
            toast.success("Cleaners assigned and booking confirmed");
            queryClient.invalidateQueries(trpc.getAllBookingsAdmin.queryOptions({}, { enabled: true }).queryKey as any);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to assign cleaners");
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Dialog.Title as="h3" className="text-xl font-bold text-[#0f172a]">
                                            Assign Cleaners
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">Select cleaners for this job</p>
                                    </div>
                                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search cleaners..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#163022]/20 focus:border-[#163022]"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {cleanersQuery.isLoading ? (
                                        <div className="py-12 text-center text-sm text-gray-400 italic">Loading cleaners...</div>
                                    ) : filteredCleaners.length === 0 ? (
                                        <div className="py-12 text-center text-sm text-gray-400 italic">No cleaners found.</div>
                                    ) : (
                                        filteredCleaners.map((cleaner) => (
                                            <button
                                                key={cleaner.id}
                                                onClick={() => toggleCleaner(cleaner.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedIds.includes(cleaner.id)
                                                        ? "bg-[#163022]/5 border-[#163022] shadow-sm"
                                                        : "bg-white border-gray-100 hover:border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: cleaner.color || "#163022" }}>
                                                        {cleaner.firstName?.[0]}{cleaner.lastName?.[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-[#0f172a]">{cleaner.firstName} {cleaner.lastName}</div>
                                                        <div className="text-xs text-gray-500">{cleaner.email}</div>
                                                    </div>
                                                </div>
                                                {selectedIds.includes(cleaner.id) && (
                                                    <div className="h-6 w-6 rounded-full bg-[#163022] flex items-center justify-center">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAssign}
                                        disabled={assignMutation.isPending || selectedIds.length === 0}
                                        className="flex items-center justify-center rounded-xl bg-[#163022] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#0f241a] transition-all disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Confirm Assignment
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
