import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const sendTaskReminderSms = baseProcedure
  .input(
    z.object({
      to: z.string(),
      task: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // This uses the OpenPhone integration created earlier.
    const response = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: env.OPENPHONE_API_KEY,
      },
      body: JSON.stringify({
        to: [input.to],
        from: env.OPENPHONE_PHONE_NUMBER,
        content: `Reminder: ${input.task}`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }

    return { success: true };
  });
