import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

        // Redirect based on user role
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
    <QuizIdentityLayout
      title="Welcome Back"
      subtitle="Sign in to manage your bookings and experience premium cleaning."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          {/* Email Field */}
          <div className="group relative">
            <label className="block text-sm font-bold text-[#163022] mb-2 ml-1 transition-all group-focus-within:text-[#163022]">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className={`w-full px-5 py-4 bg-[#f9f8f4] border ${errors.email ? 'border-red-300 ring-2 ring-red-50 focus:border-red-400' : 'border-[#e3ded2] focus:border-[#163022] focus:ring-4 focus:ring-[#163022]/5'} rounded-2xl text-[#163022] font-medium transition-all duration-300 placeholder:text-gray-400 outline-none`}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-2 text-xs font-bold text-red-500 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="group relative">
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-sm font-bold text-[#163022]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#163022]/60 hover:text-[#163022] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className={`w-full px-5 py-4 bg-[#f9f8f4] border ${errors.password ? 'border-red-300 ring-2 ring-red-50 focus:border-red-400' : 'border-[#e3ded2] focus:border-[#163022] focus:ring-4 focus:ring-[#163022]/5'} rounded-2xl text-[#163022] font-medium transition-all duration-300 placeholder:text-gray-400 outline-none`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-2 text-xs font-bold text-red-500 ml-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-[#163022] hover:bg-[#0f241a] text-white font-bold py-5 px-6 rounded-2xl shadow-xl shadow-[#163022]/10 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
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

        <div className="pt-4 text-center">
          <p className="text-sm text-[#5c5a55]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#163022] hover:underline underline-offset-4"
            >
              Sign up today
            </Link>
          </p>
        </div>
      </form>
    </QuizIdentityLayout>
  );
}

