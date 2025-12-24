import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const setCleanerAvailability = baseProcedure
  .input(
    z.object({
      cleanerId: z.number(),
      availability: z.array(
        z.object({
          dayOfWeek: z.number(),
          startTime: z.string(),
          endTime: z.string(),
          isAvailable: z.boolean(),
        })
      ),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Only allow the cleaner themselves or admin/owner
    if (
      !ctx.profile ||
      (ctx.profile.role !== "OWNER" &&
        ctx.profile.role !== "ADMIN" &&
        ctx.profile.id !== input.cleanerId)
    ) {
      throw new Error("FORBIDDEN");
    }

    const existingCount = await db.cleanerAvailability.count({
      where: { cleanerId: input.cleanerId },
    });

    if (
      existingCount > 0 &&
      ctx.profile.role !== "OWNER" &&
      ctx.profile.role !== "ADMIN"
    ) {
      throw new Error("Changes require admin approval");
    }

    await db.cleanerAvailability.deleteMany({
      where: { cleanerId: input.cleanerId },
    });

    const availability = await db.cleanerAvailability.createMany({
      data: input.availability.map((a) => ({ ...a, cleanerId: input.cleanerId })),
    });

    return availability;
  });
