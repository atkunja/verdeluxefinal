import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";

const normalizePhone = (raw: string) => {
  if (!raw) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
};

export const register = baseProcedure
  .input(
    z.object({
      email: z.string().email("Valid email is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["CLIENT", "CLEANER"]).default("CLIENT"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined;

    // Check if user already exists in app DB (case-insensitive)
    const existingUser = await db.user.findFirst({
      where: {
        email: {
          equals: input.email,
          mode: 'insensitive'
        }
      },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email already registered",
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseServer.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          role: input.role,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: normalizedPhone,
        },
      });

    // If user already exists in Supabase but NOT in our DB, we can proceed to create the profile
    const msg = authError?.message || "";
    const errCode = (authError as any)?.code || "";
    const httpStatus = (authError as any)?.status;
    const isAlreadyRegistered =
      msg.toLowerCase().includes("already registered") ||
      msg.toLowerCase().includes("already_registered") ||
      errCode === "email_exists" ||
      httpStatus === 422;

    if (authError && !isAlreadyRegistered) {
      console.error("[register] Supabase createUser error (msg):", msg);
      console.error("[register] Supabase createUser error (code):", errCode, "status:", httpStatus);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create auth account: ${authError.message}`,
      });
    }

    if (isAlreadyRegistered) {
      console.log("[register] Email already in Supabase Auth but not in DB. Resetting password and creating profile...");

      // Find the Supabase user and reset their password so we can log in
      const { data: usersData } = await supabaseServer.auth.admin.listUsers();
      const supabaseUser = usersData?.users?.find(u => u.email?.toLowerCase() === input.email.toLowerCase());

      if (supabaseUser) {
        await supabaseServer.auth.admin.updateUserById(supabaseUser.id, {
          password: input.password
        });
      }
    }

    // Create profile in app DB
    const user = await db.user.create({
      data: {
        email: input.email,
        password: "", // password is managed by Supabase Auth
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: normalizedPhone,
      },
    });

    // Sign in to get a session token to return
    const { data: signInData, error: signInError } =
      await supabaseServer.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

    if (signInError || !signInData.session) {
      console.error("[register] Sign-in after registration failed:", signInError?.message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Account created, but failed to sign in automatically. Please log in manually.",
      });
    }

    return {
      token: signInData.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  });
