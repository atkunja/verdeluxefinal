import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';

interface ManualPaymentElementProps {
    onTokenCreated: (token: string, last4: string, brand: string) => void;
    onCancel: () => void;
}

export function ManualPaymentElement({ onTokenCreated, onCancel }: ManualPaymentElementProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            const { token, error: stripeError } = await stripe.createToken(cardElement);

            if (stripeError) {
                setError(stripeError.message || "Failed to process card");
                setLoading(false);
                return;
            }

            if (token) {
                onTokenCreated(token.id, token.card?.last4 || "", token.card?.brand || "");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Secure Manual Entry</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                        },
                        hidePostalCode: true,
                    }}
                />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!stripe || loading}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Save Card"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
