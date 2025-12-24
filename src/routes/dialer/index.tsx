import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layout } from "~/components/Layout";
import { useAuthStore } from "~/stores/authStore";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/dialer/")({
  component: DialerPage,
});

function DialerPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

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

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
        <div className="max-w-2xl w-full bg-white border border-slate-200 shadow-lg rounded-3xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dialer Unavailable</h1>
          <p className="text-slate-600">
            Phone calling is temporarily disabled while we finalize the OpenPhone integration. Please use the
            new system once it is available or contact support for urgent outbound calls.
          </p>
        </div>
      </div>
    </Layout>
  );
}
