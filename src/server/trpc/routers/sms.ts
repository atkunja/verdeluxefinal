import { createTRPCRouter } from "~/server/trpc/main";
import { sendTaskReminderSms } from "../procedures/sms/sendTaskReminderSms";

export const smsRouter = createTRPCRouter({
  sendTaskReminderSms,
});
