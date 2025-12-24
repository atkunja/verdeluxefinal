import { z } from "zod";
// import bcryptjs from "bcryptjs";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";

const MAX_ATTEMPTS = 5;

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

export const verifyQuizOtp = baseProcedure
  .input(
    z.object({
      phone: z.string().min(6),
      code: z.string().length(6),
      submissionId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const phone = normalizePhone(input.phone);
    const now = new Date();

    const latest = await db.otpVerification.findFirst({
      where: { phone, verifiedAt: null, supersededAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      throw new Error("No verification code found. Please request a new code.");
    }

    if (latest.lockedUntil && latest.lockedUntil > now) {
      throw new Error("Too many attempts. Try again later.");
    }

    if (latest.expiresAt < now) {
      throw new Error("Verification code expired. Please request a new one.");
    }

    // Dynamic import to prevent startup crashes on Vercel
    const bcryptjs = (await import("bcryptjs")).default;
    const isValid = await bcryptjs.compare(input.code, latest.otpHash);
    if (!isValid) {
      const nextAttempts = latest.attemptCount + 1;
      await db.otpVerification.update({
        where: { id: latest.id },
        data: {
          attemptCount: nextAttempts,
          lockedUntil: nextAttempts >= MAX_ATTEMPTS ? new Date(now.getTime() + 15 * 60 * 1000) : null,
        },
      });
      throw new Error("Invalid code. Please try again.");
    }

    await db.otpVerification.update({
      where: { id: latest.id },
      data: { verifiedAt: now },
    });

    if (input.submissionId) {
      await db.cleanQuizSubmission.update({
        where: { id: input.submissionId },
        data: { phoneVerified: true },
      });
    }

    // Find the user by phone number to log them in
    const stripped = input.phone.replace(/\D/g, "");
    const searchTerms = Array.from(new Set([
      phone,
      input.phone,
      stripped,
      `+${stripped}`,
      stripped.startsWith("1") ? `+${stripped}` : `+1${stripped}`
    ])).filter(Boolean);

    console.log(`[verifyQuizOtp] Searching for user with terms:`, searchTerms);

    const user = await db.user.findFirst({
      where: {
        OR: searchTerms.map(t => ({ phone: t }))
      }
    });

    if (!user) {
      console.log(`[verifyQuizOtp] No user found with phone: ${phone} or ${input.phone}`);
      // Return verified but no auth - frontend might still redirect but queries will fail
      return { verified: true, token: null, user: null };
    }

    // Try to create a session for this user via Supabase
    let token: string | null = null;
    const tempPassword = process.env.VITE_BOOKING_TEMP_PASSWORD || "TempPass123!@";

    try {
      // 1. Attempt login with temp password
      console.log(`[verifyQuizOtp] Attempting login for ${user.email} with temp password...`);
      const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
        email: user.email,
        password: tempPassword,
      });

      if (!signInError && signInData.session) {
        token = signInData.session.access_token;
        console.log(`[verifyQuizOtp] Login successful for ${user.email}`);
      } else {
        // 2. If login fails, and they just verified phone, we can "force" a login
        // by resetting their password to the temp password using the Admin API.
        console.log(`[verifyQuizOtp] Temp password sign-in failed (Error: ${signInError?.message}), attempting admin password reset...`);

        const { data: usersData, error: listError } = await supabaseServer.auth.admin.listUsers();
        if (listError) {
          console.error("[verifyQuizOtp] Failed to list users for password reset:", listError);
          return { verified: true, token: null, user: null };
        }

        const supabaseUser = usersData.users.find(u => u.email?.toLowerCase() === user.email.toLowerCase());

        if (supabaseUser) {
          console.log(`[verifyQuizOtp] Found Supabase user ${supabaseUser.id}, updating password...`);
          const { error: resetError } = await supabaseServer.auth.admin.updateUserById(
            supabaseUser.id,
            { password: tempPassword }
          );

          if (!resetError) {
            console.log(`[verifyQuizOtp] Password reset successful, retrying login...`);
            const { data: retryData, error: retryError } = await supabaseServer.auth.signInWithPassword({
              email: user.email,
              password: tempPassword,
            });
            if (!retryError && retryData.session) {
              token = retryData.session.access_token;
            } else {
              console.error("[verifyQuizOtp] Retry login failed:", retryError?.message);
            }
          } else {
            console.error(`[verifyQuizOtp] Failed to reset password for ${user.email}:`, resetError.message);
          }
        } else {
          console.error(`[verifyQuizOtp] Could not find Supabase user with email ${user.email} among ${usersData.users.length} users.`);
        }
      }
    } catch (err) {
      console.error("[verifyQuizOtp] Auth session creation failed:", err);
    }

    return {
      verified: true,
      token,
      user: token ? {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      } : null,
    };
  });
