import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";
import { TRPCError } from "@trpc/server";

export const createUserAdmin = requireAdmin
  .input(
    z.object({
      email: z.string().email("Valid email is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      color: z.string().optional(),
      adminPermissions: z.record(z.boolean()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    if (!supabaseServer) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Supabase authentication service is not configured.",
      });
    }

    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email already registered in the system",
      });
    }

    // Dynamic import to prevent startup crashes on Vercel
    const bcryptjs = (await import("bcryptjs")).default;
    const hashedPassword = await bcryptjs.hash(input.password, 10);

    // 1. Create in Supabase (Auth Source of Truth)
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // Auto-confirm for admin-created users
      user_metadata: {
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    });

    // Check if user already exists in Supabase (but not in our DB, since we checked existingUser above)
    const msg = authError?.message || "";
    // Check for "already registered" error from Supabase
    const isSupabaseDuplicate = msg.toLowerCase().includes("already registered") || (authError as any)?.code === "email_exists";

    if (authError && !isSupabaseDuplicate) {
      console.error("[createUserAdmin] Supabase error:", authError);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create auth account: ${authError.message}`,
      });
    }

    // If already in Supabase, we should update their password to the one provided
    // so the admin's intention of "creating this user with this password" is honored for login.
    if (isSupabaseDuplicate) {
      // We need to find the user ID to update them
      const { data: usersData } = await supabaseServer.auth.admin.listUsers();
      const supabaseUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === input.email.toLowerCase());

      if (supabaseUser) {
        await supabaseServer.auth.admin.updateUserById(supabaseUser.id, {
          password: input.password,
          email_confirm: true, // Ensure they are confirmed
          user_metadata: {
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
          }
        });
      }
    }

    // 2. Create in Local DB
    const newUser = await db.user.create({
      data: {
        email: input.email,
        password: hashedPassword, // Keep local hash for redundancy/legacy
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        color: input.color,
        adminPermissions: input.adminPermissions,
      },
    });

    return { newUser };
  });
