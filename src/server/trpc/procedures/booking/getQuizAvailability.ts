import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const getQuizAvailability = baseProcedure
  .input(z.object({ date: z.string() }))
  .query(async ({ input }) => {
    const { start, end } = normalizeDetroitRange(input.date, input.date);
    if (!start || !end) {
      return { isFullyBooked: false, count: 0 };
    }

    const count = await db.booking.count({
      where: {
        scheduledDate: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      isFullyBooked: count >= 8,
      count,
    };
  });
