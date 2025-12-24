import { createTRPCRouter } from "~/server/trpc/main";
import { getDocuments } from "../procedures/documents/getDocuments";

export const documentsRouter = createTRPCRouter({
  getDocuments,
});
