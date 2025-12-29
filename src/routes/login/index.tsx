import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation(
    trpc.login.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast.success("Login successful!");

        if (data.user.role === "CLEANER") {
          navigate({ to: "/cleaner-portal" });
        } else if (data.user.role === "CLIENT") {
          navigate({ to: "/client-portal" });
        } else if (data.user.role === "ADMIN" || data.user.role === "OWNER") {
          navigate({ to: "/admin-portal" });
        } else {
          navigate({ to: "/" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Login failed");
      },
    })
  );

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#163022] transition-colors group mb-12"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Logo & Title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#163022] rounded-xl flex items-center justify-center shadow-lg shadow-[#163022]/20">
                <img src="/imported/images/logo.png" alt="" className="h-6 w-auto invert brightness-0" />
              </div>
              <span className="text-xl font-extrabold text-[#163022]">Verde Luxe</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500 font-medium">Sign in to access your team portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register("email")}
                className={`w-full px-4 py-3.5 bg-slate-50 border ${errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-[#163022] focus:ring-[#163022]/10'
                  } rounded-xl text-slate-900 font-medium transition-all placeholder:text-slate-400 outline-none focus:ring-4`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-xs font-bold text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-[#163022]/70 hover:text-[#163022] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={`w-full px-4 py-3.5 bg-slate-50 border ${errors.password
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-[#163022] focus:ring-[#163022]/10'
                  } rounded-xl text-slate-900 font-medium transition-all placeholder:text-slate-400 outline-none focus:ring-4`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-xs font-bold text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#163022] hover:bg-[#0f241a] text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-[#163022]/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#163022] hover:underline underline-offset-4"
              >
                Sign up today
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#0d1d14] via-[#163022] to-[#1a3a2a] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-16 text-center">
          <div className="mb-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400/80 mb-4">Team Portal</div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Manage Your<br />
              <span className="text-emerald-400">Business</span> Effortlessly
            </h2>
            <p className="text-white/60 max-w-sm mx-auto leading-relaxed">
              Access bookings, manage schedules, and track performance all in one premium dashboard.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium border border-white/10">
              📅 Booking Management
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium border border-white/10">
              📊 Analytics
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm font-medium border border-white/10">
              💬 Messaging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
