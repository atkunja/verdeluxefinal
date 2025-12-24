import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";

export const getTimeOffRequests = baseProcedure
  .input(z.object({}).optional())
  .query(async ({ input, ctx }) => {
    // Resolve user from context or supplied Supabase token
    let user = ctx.profile;
    if (!user && ctx.token) {
      const supa = await supabaseServer.auth.getUser(ctx.token);
      const email = supa?.data?.user?.email;
      if (email) {
        const dbUser = await db.user.findUnique({ where: { email } });
        if (dbUser) {
          user = dbUser as any;
        }
      }
    }

    if (user.role !== "CLEANER") {
      throw new Error("Only cleaners can view time-off requests");
    }

    // Fetch all time-off requests for this cleaner
    const requests = await db.timeOffRequest.findMany({
      where: {
        cleanerId: user.id,
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      requests,
    };
  });
