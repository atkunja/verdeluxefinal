import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface CancelOptions {
    scope: "single" | "series";
    applyFee: boolean;
    feeAmount?: number;
    notifyEmail: boolean;
    notifySms: boolean;
    reason?: string;
}

interface CancelBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: {
        id: string | number;
        customerName: string;
        price: number;
        isRecurring?: boolean;
        date: string;
        time: string;
    } | null;
    onConfirm: (options: CancelOptions) => Promise<void>;
}

export function CancelBookingModal({ isOpen, onClose, booking, onConfirm }: CancelBookingModalProps) {
    const [scope, setScope] = useState<"single" | "series">("single");
    const [applyFee, setApplyFee] = useState(false);
    const [feeAmount, setFeeAmount] = useState<number>(0);
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifySms, setNotifySms] = useState(false);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when opening a new booking
    // (In a real app, use useEffect on booking change to reset defaults)

    if (!isOpen || !booking) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm({
                scope,
                applyFee,
                feeAmount: applyFee ? feeAmount : undefined,
                notifyEmail,
                notifySms,
                reason,
            });
            onClose();
        } catch (error) {
            console.error("Cancellation failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculatedFee = (booking.price * 0.5).toFixed(2); // Default to 50%

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Cancel Booking</h2>
                            <p className="text-xs text-gray-500">#{booking.id} • {booking.customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm text-red-800">
                        <p className="font-medium">Are you sure you want to cancel this booking?</p>
                        <p className="tex-xs mt-1 text-red-700/80">
                            {booking.date} at {booking.time}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Scope Selection (if potentially recurring) */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Cancellation Scope</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setScope("single")}
                                    className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${scope === "single"
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    This Booking Only
                                </button>
                                <button
                                    onClick={() => setScope("series")}
                                    className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${scope === "series"
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    All Future Bookings
                                </button>
                            </div>
                        </div>

                        {/* Fee Option */}
                        <div className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="applyFee"
                                        checked={applyFee}
                                        onChange={(e) => {
                                            setApplyFee(e.target.checked);
                                            if (e.target.checked && feeAmount === 0) {
                                                setFeeAmount(Number(calculatedFee));
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
                                    />
                                    <label htmlFor="applyFee" className="text-sm font-medium text-gray-900">
                                        Apply Cancellation Fee
                                    </label>
                                </div>
                            </div>
                            {applyFee && (
                                <div className="pl-6">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            value={feeAmount}
                                            onChange={(e) => setFeeAmount(Number(e.target.value))}
                                            className="block w-full rounded-md border border-gray-200 pl-7 pr-3 py-1.5 text-sm focus:border-[#163022] focus:outline-none"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Typically 50% of booking total (${booking.price.toFixed(2)})
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Notifications</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="notifyEmail"
                                    checked={notifyEmail}
                                    onChange={(e) => setNotifyEmail(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
                                />
                                <label htmlFor="notifyEmail" className="text-sm text-gray-700">Send email to customer</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="notifySms"
                                    checked={notifySms}
                                    onChange={(e) => setNotifySms(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#163022] focus:ring-[#163022]"
                                />
                                <label htmlFor="notifySms" className="text-sm text-gray-700">Send SMS to customer</label>
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Cancellation Reason (Internal)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Schedule conflict, Customer request..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm h-20 focus:border-[#163022] focus:outline-none resize-none"
                            />
                        </div>

                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Keep Booking
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-70"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
