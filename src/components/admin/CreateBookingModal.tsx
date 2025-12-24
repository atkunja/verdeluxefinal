
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { toast } from "react-hot-toast";

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateBookingModal({ isOpen, onClose }: CreateBookingModalProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const createMutation = useMutation(trpc.createBookingAdmin.mutationOptions());

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            await createMutation.mutateAsync({
                clientEmail: formData.get("clientEmail") as string,
                clientFirstName: formData.get("clientFirstName") as string,
                clientLastName: formData.get("clientLastName") as string,
                clientPhone: formData.get("clientPhone") as string,
                serviceType: formData.get("serviceType") as string,
                scheduledDate: new Date(formData.get("scheduledDate") as string).toISOString(),
                scheduledTime: formData.get("scheduledTime") as string,
                address: formData.get("address") as string,
                durationHours: Number(formData.get("durationHours")) || 2,
                finalPrice: Number(formData.get("finalPrice")) || 0,
                status: "CONFIRMED",
                paymentMethod: "CREDIT_CARD", // Default
            });

            toast.success("Booking created");
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
                    <div className="fixed inset-0 bg-black/25" />
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        New Admin Booking
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Client Details</h4>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input required type="email" name="clientEmail" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input required type="tel" name="clientPhone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                                        <input required type="text" name="clientFirstName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                        <input required type="text" name="clientLastName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>

                                    <div className="md:col-span-2 mt-2">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Booking Details</h4>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <input required type="text" name="address" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                        <select name="serviceType" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm">
                                            <option value="Standard Home Cleaning">Standard Home Cleaning</option>
                                            <option value="Deep Home Cleaning">Deep Home Cleaning</option>
                                            <option value="Move-In/Out Cleaning">Move-In/Out Cleaning</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                                        <input required type="number" step="0.01" name="finalPrice" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date</label>
                                        <input required type="date" name="scheduledDate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Time</label>
                                            <input required type="time" name="scheduledTime" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-sm font-medium text-gray-700">Hours</label>
                                            <input required type="number" step="0.5" name="durationHours" defaultValue="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border sm:text-sm" />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createMutation.isPending}
                                            className="flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Create Booking
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
