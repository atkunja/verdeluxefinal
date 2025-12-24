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
    const [scope, setScope] = useState<"single" | "series">("single");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(scope);
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
                        <p className="font-medium">Rescheduling this booking</p>
                        <p className="text-xs mt-1 text-blue-700/80">
                            You are moving this booking to a new date.
                        </p>
                    </div>

                    {booking.isRecurring ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Move Scope</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setScope("single")}
                                    className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${scope === "single"
                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    This Booking Only
                                </button>
                                <button
                                    onClick={() => setScope("series")}
                                    className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${scope === "series"
                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    This & All Future
                                </button>
                            </div>
                            <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <p>
                                    {scope === "series"
                                        ? "Moving the series will shift all future occurrences relative to the new date."
                                        : "Moving only this occurrence will not affect the rest of the schedule."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Confirm you want to move this booking to the selected date.</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 rounded-xl bg-[#163022] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f241a] shadow-sm disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Moving..." : "Confirm Move"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
