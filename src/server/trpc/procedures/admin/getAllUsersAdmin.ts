import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getAllUsersAdmin = requireAdmin
  .input(
    z.object({
      role: z.union([
        z.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]),
        z.array(z.enum(["CLIENT", "CLEANER", "ADMIN", "OWNER"]))
      ]).optional(),
      search: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const where: any = {};
    if (input.role) {
      if (Array.isArray(input.role)) {
        where.role = { in: input.role };
      } else {
        where.role = input.role;
      }
    }
    if (input.search) {
      const q = input.search;
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        color: true,
        createdAt: true,
        temporaryPassword: true,
        hasResetPassword: true,
        adminPermissions: true,
        isPinned: true,
        notes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const leads = await db.lead.findMany({
      where: {
        status: { not: "CONVERTED" }, // Only show non-converted leads
        OR: input.search ? [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ] : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    return { users, leads };
  });
