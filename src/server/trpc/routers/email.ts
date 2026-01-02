import { createTRPCRouter } from "~/server/trpc/main";
import { createEmailTemplate } from "../procedures/email/createEmailTemplate";
import { getEmailTemplates } from "../procedures/email/getEmailTemplates";
import { updateEmailTemplate } from "../procedures/email/updateEmailTemplate";
import { deleteEmailTemplate } from "../procedures/email/deleteEmailTemplate";
import { sendTestEmail } from "../procedures/admin/sendTestEmail";

export const emailRouter = createTRPCRouter({
  createEmailTemplate,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendTestEmail,
});
