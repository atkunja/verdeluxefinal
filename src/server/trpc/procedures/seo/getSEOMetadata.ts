import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getSEOMetadata = baseProcedure.query(async () => {
  const metadata = await db.sEOMetadata.findMany();
  return metadata;
});
