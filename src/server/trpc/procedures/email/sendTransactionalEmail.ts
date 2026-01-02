import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { sendEmail } from "~/server/services/email";

export const sendTransactionalEmail = baseProcedure
  .input(
    z.object({
      to: z.string().email(),
      templateType: z.string(),
      context: z.record(z.any()).optional(),
      fallbackSubject: z.string().optional(),
      fallbackBody: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    return await sendEmail(input);
  });
