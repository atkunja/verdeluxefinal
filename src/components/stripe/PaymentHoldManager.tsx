import { api } from "~/utils/api";

export function PaymentHoldManager() {
  // This is a placeholder. A real implementation would list payment intents
  // and allow for capturing or releasing them.
  const captureMutation = api.stripe.capturePayment.useMutation();

  const handleCapture = (paymentIntentId: string) => {
    captureMutation.mutate({ paymentIntentId });
  };

  return (
    <div>
      <h3>Payment Hold Manager</h3>
      {/* TODO: Add UI for listing and managing payment holds */}
    </div>
  );
}
