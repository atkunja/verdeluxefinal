import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "~/components/Layout";
import { useAuthStore } from "~/stores/authStore";
import { Phone, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/dialer/")({
  component: DialerPage,
});

function DialerPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, user } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState("");

  // Redirect unauthenticated or unauthorized users
  useEffect(() => {
    if (!token || !user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      navigate({ to: "/" });
    }
  }, [token, user, navigate]);

  const makeCallMutation = useMutation(
    trpc.makeCall.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.note || "Call initiated");
        setPhoneNumber("");
      },
      onError: (err: any) => {
        toast.error(`Call failed: ${err.message}`);
      },
    })
  );

  const handleDial = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!token) return;
    makeCallMutation.mutate({
      authToken: token,
      toNumber: phoneNumber,
    });
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200 shadow-2xl rounded-[40px] p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dialer</h1>
            <p className="text-slate-500 font-medium">Outbound calls via OpenPhone</p>
          </div>

          {/* Display */}
          <div className="relative">
            <input
              type="text"
              readOnly
              value={phoneNumber}
              placeholder="(000) 000-0000"
              className="w-full text-4xl font-bold text-center py-6 bg-slate-50 border-none rounded-2xl focus:ring-0 placeholder:text-slate-200 overflow-x-auto"
            />
            {phoneNumber && (
              <button
                onClick={handleBackspace}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Backspace"
              >
                <RefreshCw className="w-6 h-6 rotate-45" /> {/* Using RefreshCw as a placeholder for a backspace icon look or just use X */}
              </button>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDial(digit)}
                className="w-20 h-20 mx-auto rounded-full bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all active:scale-90 flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Call Button */}
          <div className="pt-4">
            <button
              onClick={handleCall}
              disabled={makeCallMutation.isPending}
              className="w-full h-20 rounded-[30px] bg-emerald-500 text-white text-xl font-bold hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {makeCallMutation.isPending ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Phone className="w-7 h-7 fill-current" />
                  <span>Call</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
