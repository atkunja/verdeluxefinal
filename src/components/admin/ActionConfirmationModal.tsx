import { ReactNode, useState } from "react";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";

interface ActionConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "info" | "success" | "warning";
    onConfirm: () => Promise<void>;
}

export function ActionConfirmationModal({
    isOpen,
    onClose,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "info",
    onConfirm
}: ActionConfirmationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const variantStyles = {
        danger: {
            icon: <AlertCircle className="w-5 h-5 text-red-600" />,
            iconBg: "bg-red-50",
            button: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
            iconBg: "bg-amber-50",
            button: "bg-amber-600 hover:bg-amber-700",
        },
        success: {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
            iconBg: "bg-emerald-50",
            button: "bg-emerald-600 hover:bg-emerald-700",
        },
        info: {
            icon: <AlertCircle className="w-5 h-5 text-blue-600" />,
            iconBg: "bg-blue-50",
            button: "bg-[#163022] hover:bg-[#0f241a]",
        }
    };

    const style = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all scale-100">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                            {style.icon}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                        {description}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-70 transition-colors ${style.button}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Processing..." : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
