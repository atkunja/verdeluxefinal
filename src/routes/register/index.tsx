import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";
import React from "react";
import { QuizIdentityLayout } from "~/components/bookings/wizard/QuizIdentityLayout";
import { buttonPrimary, inputBase } from "~/components/bookings/wizard/styles";

export const Route = createFileRoute("/register/")({
  component: RegisterPage,
});

const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["CLIENT", "CLEANER"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "CLIENT",
    },
  });

  const registerMutation = useMutation(
    trpc.register.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.token, data.user);
        toast.success("Account created successfully!");

        if (data.user.role === "CLEANER") {
          navigate({ to: "/cleaner-portal" });
        } else {
          navigate({ to: "/client-portal" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed");
      },
    })
  );

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  return (
    <QuizIdentityLayout
      title="Create account"
      subtitle="Join Verde Luxe for a premium, bespoke cleaning experience."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">First Name</label>
            <input
              {...register("firstName")}
              className={`${inputBase} mt-1.5 py-3`}
              placeholder="Jane"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600 font-medium">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">Last Name</label>
            <input
              {...register("lastName")}
              className={`${inputBase} mt-1.5 py-3`}
              placeholder="Doe"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600 font-medium">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            {...register("email")}
            className={`${inputBase} mt-1.5 py-3`}
            placeholder="jane@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            {...register("phone")}
            className={`${inputBase} mt-1.5 py-3`}
            placeholder="(555) 123-4567"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">Password</label>
            <input
              type="password"
              {...register("password")}
              className={`${inputBase} mt-1.5 py-3`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">Confirm</label>
            <input
              type="password"
              {...register("confirmPassword")}
              className={`${inputBase} mt-1.5 py-3`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#163022] uppercase tracking-wider">I am a</label>
          <select
            {...register("role")}
            className={`${inputBase} mt-1.5 py-3 bg-[#f7f4ed]`}
          >
            <option value="CLIENT">Client (Looking for cleaning)</option>
            <option value="CLEANER">Cleaner (Providing services)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className={`${buttonPrimary} w-full py-4 text-lg shadow-xl active:scale-[0.98] disabled:opacity-70 mt-4`}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Creating Account...
            </span>
          ) : "Create Account"}
        </button>

        <p className="text-center text-sm text-[#5c5a55]">
          Already have an account? <Link to="/login" className="font-bold underline text-[#163022]">Sign in</Link>
        </p>
      </form>
    </QuizIdentityLayout>
  );
}

