// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";

export const forgotPassword = baseProcedure
  .input(
    z.object({
      email: z.string().email("Valid email is required"),
      temporaryPassword: z.string().min(1, "Temporary password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No account found with this email address",
      });
    }

    // Check if user has a temporary password set
    if (user.temporaryPassword) {
      // User has a temporary password, so we must verify it matches
      if (input.temporaryPassword !== user.temporaryPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect temporary password. Please contact us if you've forgotten it.",
        });
      }
    } else {
      // User doesn't have a temporary password (they set their own password during registration)
      // In this case, we still require them to provide the temporary password field,
      // but we'll reject it since they should use the login flow instead
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This account was not created with a temporary password. Please use the login page or contact support.",
      });
    }

    // Update password in Supabase Auth
    const { data: users, error: listError } =
      await supabaseServer.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        email: input.email,
      });

    if (listError || !users.users?.[0]) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to locate account in auth provider",
      });
    }

    const supabaseUserId = users.users[0]!.id;

    const { error: updateError } =
      await supabaseServer.auth.admin.updateUserById(supabaseUserId, {
        password: input.newPassword,
      });

    if (updateError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to reset password. Please try again.",
      });
    }

    // Update user's metadata in our DB
    await db.user.update({
      where: { id: user.id },
      data: {
        hasResetPassword: true, // Mark that they've reset their password
        // temporaryPassword is intentionally NOT cleared so staff can always see it
      },
    });

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    };
  });
