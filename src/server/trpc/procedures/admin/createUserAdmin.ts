import { z } from "zod";
import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

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
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcryptjs.hash(input.password, 10);

    const newUser = await db.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
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
