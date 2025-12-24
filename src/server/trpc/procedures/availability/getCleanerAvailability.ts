import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getCleanerAvailability = baseProcedure
  .input(z.object({ cleanerId: z.number() }))
  .query(async ({ input }) => {
    const availability = await db.cleanerAvailability.findMany({
      where: { cleanerId: input.cleanerId },
    });

    return availability;
  });
