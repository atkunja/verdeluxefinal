import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { sendEmail } from "~/server/services/email";

export const sendTestEmail = requireAdmin
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
        return await sendEmail({
            to: input.email,
            templateType: "TEST_EMAIL",
            fallbackSubject: "Test Email from LuxeClean",
            fallbackBody: "This is a test email to verify your SMTP configuration. If you are reading this, your email system is working correctly!",
        });
    });
