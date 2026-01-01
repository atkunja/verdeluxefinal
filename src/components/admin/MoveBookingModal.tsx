import { useState } from "react";
import { Calendar, X, AlertCircle } from "lucide-react";

interface MoveBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: {
        id: string | number;
        customerName: string;
        date: string;
        isRecurring: boolean;
    } | null;
    onConfirm: (scope: "single" | "series") => Promise<void>;
}

export function MoveBookingModal({ isOpen, onClose, booking, onConfirm }: MoveBookingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const handleConfirm = async (selectedScope: "single" | "series") => {
        setIsSubmitting(true);
        try {
            await onConfirm(selectedScope);
            onClose();
        } catch (error) {
            console.error("Move failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Move Booking</h2>
                            <p className="text-xs text-gray-500">#{booking.id} • {booking.customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                        <p className="font-medium">Rescheduling Confirmation</p>
                        <p className="text-xs mt-1 text-blue-700/80">
                            Move booking from <span className="font-bold">{booking.date}</span> (Original) to a new date?
                        </p>
                    </div>

                    {booking.isRecurring ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 block">Select Move Type</label>

                            <button
                                onClick={() => handleConfirm("single")}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group text-left"
                            >
                                <div>
                                    <div className="font-bold text-gray-900 group-hover:text-[#163022]">Move This Occurrence Only</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Other bookings in the series remain unchanged.</div>
                                </div>
                                <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-[#163022]">
                                    <div className="h-2.5 w-2.5 rounded-full bg-[#163022] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>

                            <button
                                onClick={() => handleConfirm("series")}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group text-left"
                            >
                                <div>
                                    <div className="font-bold text-gray-900 group-hover:text-[#163022]">Move This & All Future</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Shift the entire schedule from this date forward.</div>
                                </div>
                                <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-[#163022]">
                                    <div className="h-2.5 w-2.5 rounded-full bg-[#163022] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Are you sure you want to calculate the new price and move this booking?</p>
                    )}

                    {!booking.isRecurring && (
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirm("single")}
                                className="flex-1 rounded-xl bg-[#163022] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f241a] shadow-sm disabled:opacity-70"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Moving..." : "Confirm Move"}
                            </button>
                        </div>
                    )}

                    {booking.isRecurring && (
                        <button
                            onClick={onClose}
                            className="w-full mt-2 text-xs font-semibold text-gray-400 hover:text-gray-600 py-2"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
