import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getSystemLogs = baseProcedure.query(async () => {
  const logs = await db.systemLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return logs;
});
