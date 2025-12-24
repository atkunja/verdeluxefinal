import { createTRPCRouter } from "~/server/trpc/main";
import { getSystemLogs } from "../procedures/system/getSystemLogs";

export const systemRouter = createTRPCRouter({
  getSystemLogs,
});
