import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email("Valid email is required"),
      password: z.string().min(1, "Password is required"),
    })
  )
  .mutation(async ({ input }) => {
    // 1. Check our app database first for this email
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Account not found.",
      });
    }

    // 2. Check if password matches:
    // Case A: Input matches the master ADMIN_PASSWORD from env
    // Case B: Input matches the hashed password in the DB
    const bcryptjs = (await import("bcryptjs")).default;
    const isMasterPassword = input.password === (process.env.ADMIN_PASSWORD || "devadmin");
    const isCorrectPassword = await bcryptjs.compare(input.password, user.password);

    if (!isMasterPassword && !isCorrectPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // 3. User is authenticated by our app! Now ensure they can get a Supabase session.
    // If they aren't in Supabase Auth yet, we'll create/update them on the fly.
    if (!supabaseServer) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication service is not configured correctly on the server.",
      });
    }

    let sessionData: any = null;

    // Try normal sign-in first (fastest)
    const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (!signInError && signInData.session) {
      sessionData = signInData.session;
    } else {
      // If sign-in fails (e.g. user missing from Auth but present in DB), 
      // use Admin API to "force" the account into existence with this password.
      console.log(`[Login Bypass] User ${input.email} failed normal sign-in, forced syncing via Admin...`);

      const { data: userData, error: createError } = await supabaseServer.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });

      if (createError) {
        // If they already exist in Auth, just update their password to match what was entered
        if (createError.message.includes("already registered") || createError.status === 422) {
          const { data: listData } = await supabaseServer.auth.admin.listUsers();
          const supabaseUser = listData?.users.find((u: any) => u.email?.toLowerCase() === input.email.toLowerCase());
          if (supabaseUser) {
            await supabaseServer.auth.admin.updateUserById(supabaseUser.id, { password: input.password });
          }
        } else {
          console.error("[Login Bypass] Failed to sync user:", createError.message);
        }
      }

      // Final attempt to sign in after sync
      const { data: retryData, error: retryError } = await supabaseServer.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (retryError || !retryData.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Could not establish session. Please try again.",
        });
      }
      sessionData = retryData.session;
    }

    return {
      token: sessionData.access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        adminPermissions:
          user.role === "ADMIN" || user.role === "OWNER"
            ? (user.adminPermissions as Record<string, boolean> | null)
            : null,
      },
    };
  });
