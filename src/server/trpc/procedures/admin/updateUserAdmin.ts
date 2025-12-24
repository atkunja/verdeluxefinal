import { z } from "zod";
// import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

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
