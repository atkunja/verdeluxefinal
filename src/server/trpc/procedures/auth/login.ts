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
    // Supabase Auth sign-in
    if (!supabaseServer) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication service is not configured correctly on the server. Please check environment variables.",
      });
    }

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Fetch role/profile from our app DB
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Account exists in Supabase Auth but no matching profile. Contact support.",
      });
    }

    return {
      token: data.session.access_token,
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
