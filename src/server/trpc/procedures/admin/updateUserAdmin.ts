import { z } from "zod";
// import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";

export const updateUserAdmin = requireAdmin
  .input(
    z.object({
      userId: z.number(),
      email: z.string().email("Invalid email address").optional(),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
      role: z.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]).optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      temporaryPassword: z.string().optional(),
      color: z
        .union([z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)"), z.null()])
        .optional(),
      adminPermissions: z.record(z.boolean()).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const targetUser = await db.user.findUnique({
      where: { id: input.userId },
    });

    if (!targetUser) {
      throw new Error("User to update not found");
    }

    if (input.email && input.email !== targetUser.email) {
      const existingUser = await db.user.findUnique({ where: { email: input.email } });
      if (existingUser) {
        throw new Error("Email already in use");
      }
    }

    const updateData: any = {};
    if (input.email !== undefined) updateData.email = input.email;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.color !== undefined) updateData.color = input.color;

    if (input.password) {
      // Dynamic import to prevent startup crashes on Vercel
      const bcryptjs = (await import("bcryptjs")).default;
      updateData.password = await bcryptjs.hash(input.password, 10);

      // Sync password update to Supabase Auth
      if (supabaseServer) {
        try {
          // Find user by email (using original email if not changing, or new email if handled sequentially)
          // Note: If email is changing, we should probably update supabase first.
          // But logic here handles them independently in local updateData construction.
          // Let's rely on targetUser.email which is the CURRENT email.

          const { data: usersData } = await supabaseServer.auth.admin.listUsers();
          const supabaseUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === targetUser.email.toLowerCase());

          if (supabaseUser) {
            await supabaseServer.auth.admin.updateUserById(supabaseUser.id, {
              password: input.password
            });
          } else {
            console.warn("[updateUserAdmin] Could not find Supabase user to update password for:", targetUser.email);
          }
        } catch (err) {
          console.error("[updateUserAdmin] Failed to update Supabase password:", err);
          // We don't throw here to allow local update to proceed, or maybe we should?
          // Proceeding allows at least local consistency, but login might fail.
          // Given the critical nature, we should probably warn but proceed.
        }
      }
    }

    // Sync Email Update to Supabase
    if (input.email && input.email !== targetUser.email && supabaseServer) {
      try {
        const { data: usersData } = await supabaseServer.auth.admin.listUsers();
        const supabaseUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === targetUser.email.toLowerCase());

        if (supabaseUser) {
          await supabaseServer.auth.admin.updateUserById(supabaseUser.id, {
            email: input.email,
            email_confirm: true
          });
        }
      } catch (err) {
        console.error("[updateUserAdmin] Failed to update Supabase email:", err);
      }
    }

    if (input.temporaryPassword !== undefined) {
      if (input.temporaryPassword === "" || input.temporaryPassword === null) {
        updateData.temporaryPassword = null;
        updateData.hasResetPassword = false;
      } else if (input.temporaryPassword.length >= 6) {
        updateData.temporaryPassword = input.temporaryPassword;
        updateData.hasResetPassword = false;
      }
    }

    if (
      input.adminPermissions !== undefined &&
      (targetUser.role === "ADMIN" || targetUser.role === "OWNER" || input.role === "ADMIN" || input.role === "OWNER")
    ) {
      updateData.adminPermissions = input.adminPermissions;
    }

    const updatedUser = await db.user.update({
      where: { id: input.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        color: true,
        createdAt: true,
      },
    });

    return { user: updatedUser };
  });
