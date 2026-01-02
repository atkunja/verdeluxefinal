import nodemailer from "nodemailer";
import { db } from "../db";

export type EmailOptions = {
    to: string;
    templateType: string;
    context?: Record<string, any>;
    fallbackSubject?: string;
    fallbackBody?: string;
};

export async function sendEmail(options: EmailOptions) {
    const template = await db.emailTemplate.findFirst({
        where: { type: options.templateType },
    });

    const subject = template?.subject || options.fallbackSubject || "Notification";
    let body = template?.body || options.fallbackBody || "";

    if (options.context && body) {
        // simple interpolation {{key}}
        body = body.replace(/{{(.*?)}}/g, (_, key) => {
            const trimmed = key.trim();
            const value = options.context?.[trimmed];
            return value !== undefined ? String(value) : "";
        });
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "localhost",
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false,
    });

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || "no-reply@verdeluxe.com",
            to: options.to,
            subject,
            text: body,
        });
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.warn("⚠️ SMTP connection refused. Logging email to console instead:");
            console.log(`[Email Mock] To: ${options.to}`);
            console.log(`[Email Mock] Subject: ${subject}`);
            console.log(`[Email Mock] Body:\n${body}`);
        } else {
            throw error;
        }
    }

    // Log if template and recipient match a known user
    if (template) {
        const recipient = await db.user.findFirst({ where: { email: options.to }, select: { id: true } });
        if (recipient) {
            await db.emailLog.create({
                data: {
                    recipientId: recipient.id,
                    templateId: template.id,
                    sentAt: new Date(),
                    status: "sent",
                },
            });
        }
    }

    return { success: true };
}
