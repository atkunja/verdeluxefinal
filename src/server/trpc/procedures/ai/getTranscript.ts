import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getTranscript = baseProcedure
  .input(z.object({ callId: z.number() }))
  .query(async ({ input }) => {
    const transcript = await db.aITranscript.findFirst({
      where: { callId: input.callId },
    });
    return transcript;
  });
