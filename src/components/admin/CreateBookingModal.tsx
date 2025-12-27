import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { AdminBookingForm } from "~/components/AdminBookingForm";

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateBookingModal({ isOpen, onClose }: CreateBookingModalProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const createMutation = useMutation(trpc.createBookingAdmin.mutationOptions());

    const clientsQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({ role: "CLIENT" }, { enabled: isOpen }));
    const cleanersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({ role: "CLEANER" }, { enabled: isOpen }));

    const handleSubmit = async (data: any) => {
        try {
            // Transform date and time into a single ISO string for the backend if needed, 
            // but the backend expects scheduledDate as ISO and scheduledTime as string.
            // AdminBookingForm provides scheduledDate as YYYY-MM-DD.
            const isoDate = data.scheduledDate ? new Date(data.scheduledDate).toISOString() : new Date().toISOString();

            await createMutation.mutateAsync({
                ...data,
                scheduledDate: isoDate,
                status: "CONFIRMED",
            });

            toast.success("Booking created successfully");
            queryClient.invalidateQueries(trpc.getAllBookingsAdmin.queryOptions({}, { enabled: true }).queryKey as any);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to create booking");
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
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all h-[90vh] flex flex-col">
                                {clientsQuery.isError || cleanersQuery.isError ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Access Denied</h3>
                                        <p className="text-gray-500 max-w-md mt-1">
                                            {((clientsQuery.error as any)?.message === "FORBIDDEN" || (cleanersQuery.error as any)?.message === "FORBIDDEN")
                                                ? "Your account does not have administrator privileges required to view the client and cleaner lists."
                                                : "There was an error loading the form data. Please try again."}
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : clientsQuery.isLoading || cleanersQuery.isLoading ? (
                                    <div className="flex-1 flex items-center justify-center p-12">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="text-gray-600 font-medium">Loading form data...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <AdminBookingForm
                                        clients={(clientsQuery.data?.users as any) || []}
                                        cleaners={(cleanersQuery.data?.users as any) || []}
                                        onSubmit={handleSubmit}
                                        onCancel={onClose}
                                        isSubmitting={createMutation.isPending}
                                    />
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
