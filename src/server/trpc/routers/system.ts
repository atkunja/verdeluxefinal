import { createTRPCRouter } from "~/server/trpc/main";
import { getSystemLogs } from "../procedures/system/getSystemLogs";
import { getPublicConfig } from "../procedures/system/getPublicConfig";

export const systemRouter = createTRPCRouter({
  getSystemLogs,
  getPublicConfig,
});
