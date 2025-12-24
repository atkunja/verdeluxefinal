import { z } from "zod";
import bcryptjs from "bcryptjs";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { env } from "~/server/env";
import crypto from "node:crypto";

const OTP_TTL_MINUTES = 10;
const MAX_RESENDS = 3;

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return raw.startsWith("+") ? raw : `+${digits}`;
};

const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, "0");

export const sendQuizOtp = baseProcedure
  .input(z.object({ phone: z.string().min(6) }))
  .mutation(async ({ input }) => {
    if (!env.OPENPHONE_API_KEY || !env.OPENPHONE_PHONE_NUMBER) {
      throw new Error("SMS delivery is not configured. Please add OPENPHONE_API_KEY and OPENPHONE_PHONE_NUMBER env vars.");
    }

    const phone = normalizePhone(input.phone);
    const now = new Date();

    const latest = await db.otpVerification.findFirst({
      where: { phone, verifiedAt: null, supersededAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (latest?.lockedUntil && latest.lockedUntil > now) {
      throw new Error("Too many attempts. Try again later.");
    }

    if (latest && latest.resendCount >= MAX_RESENDS && latest.createdAt > new Date(now.getTime() - 15 * 60 * 1000)) {
      throw new Error("Resend limit reached. Please wait before trying again.");
    }

    let code = generateOtp();
    let otpHash = await bcryptjs.hash(code, 10);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

    const response = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: env.OPENPHONE_API_KEY,
      },
      body: JSON.stringify({
        to: [phone],
        from: env.OPENPHONE_PHONE_NUMBER,
        userId: env.OPENPHONE_USER_ID,
        content: `Your Verde Luxe verification code is ${code}. It expires in 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // In development, allow a graceful fallback so OTP flow isn't blocked by SMS config.
      if (process.env.NODE_ENV !== "production") {
        code = "000000";
        otpHash = await bcryptjs.hash(code, 10);
        console.warn(
          "[sendQuizOtp] SMS send failed; falling back to dev mode. Ensure OpenPhone creds are set. " +
          `status=${response.status} body=${errorText} devCode=${code} from=${env.OPENPHONE_PHONE_NUMBER} keyPrefix=${env.OPENPHONE_API_KEY?.slice(0, 6) || "missing"}`
        );
      } else {
        if (response.status === 401) {
          throw new Error(`OpenPhone rejected the request (401). Check API key/phone number credentials. Body: ${errorText}`);
        }
        throw new Error(`Failed to send verification code. ${response.status} ${response.statusText} ${errorText}`);
      }
    }

    await db.otpVerification.updateMany({
      where: { phone, verifiedAt: null, supersededAt: null },
      data: { supersededAt: now },
    });

    const resendCount = latest ? latest.resendCount + 1 : 0;
    await db.otpVerification.create({
      data: {
        phone,
        otpHash,
        expiresAt,
        resendCount,
      },
    });

    return { phone, expiresAt, devCode: process.env.NODE_ENV !== "production" ? code : undefined };
  });
