import { createTRPCRouter } from "~/server/trpc/main";
import { bulkDeleteUsers } from "../procedures/bulk/bulkDeleteUsers";
import { bulkUpdateUsers } from "../procedures/bulk/bulkUpdateUsers";
import { exportUsersToCsv } from "../procedures/bulk/exportUsersToCsv";

export const bulkRouter = createTRPCRouter({
  bulkDeleteUsers,
  bulkUpdateUsers,
  exportUsersToCsv,
});
