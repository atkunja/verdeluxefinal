import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getAllTimeOffRequests = requireAdmin.query(async () => {
  const requests = await db.timeOffRequest.findMany({
    include: {
      cleaner: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      reviewedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { requests };
});
