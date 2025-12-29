import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const makeCall = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      toNumber: z.string().min(10, "Valid phone number is required"),
    })
  )
  .mutation(async ({ input }) => {
    // Verify JWT token
    let userId: number;
    try {
      const decoded = jwt.verify(input.authToken, env.JWT_SECRET) as {
        userId: number;
      };
      userId = decoded.userId;
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid authentication token",
      });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Try to find a contact user with this phone number
    const { openPhone } = await import("~/server/services/openphone");
    const normalizedToPhone = openPhone.normalizePhone(input.toNumber);
    const normalizedDigits = normalizedToPhone.replace(/\D/g, "");

    const contactUser = await db.user.findFirst({
      where: {
        phone: {
          contains: normalizedDigits.slice(-10), // Match last 10 digits
        },
      },
    });

    try {
      const response = await fetch("https://api.openphone.com/v1/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${env.OPENPHONE_API_KEY}`, // Using Bearer if needed, but openphone.ts uses direct key. 
          // Wait, openphone.ts uses: headers: { Authorization: `${env.OPENPHONE_API_KEY}` }
          // Let's keep it consistent with our working service.
        },
        body: JSON.stringify({
          to: normalizedToPhone,
          from: openPhone.normalizePhone(env.OPENPHONE_PHONE_NUMBER || ""),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text(); // Or response.json() if the error is in JSON format
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to initiate call: ${errorBody}`,
        });
      }

      const call = await response.json();

      // Log the call to your database
      const callLog = await db.callLog.create({
        data: {
          userId,
          contactId: contactUser?.id,
          callSid: call.id,
          fromNumber: env.OPENPHONE_PHONE_NUMBER,
          toNumber: input.toNumber,
          status: call.status,
          direction: "outbound",
          startTime: new Date(),
        } as any,
      });

      return {
        success: true,
        callSid: call.id,
        status: call.status,
        callLogId: callLog.id,
        note: "Call initiated successfully.",
      };
    } catch (error) {
      let message = "An unknown error occurred.";
      if (error instanceof Error) {
        message = error.message;
      }
      // Log the error for debugging purposes
      console.error("Error making call:", error);

      // Create a failure log in your database
      const callLog = await db.callLog.create({
        data: {
          userId,
          contactId: contactUser?.id,
          callSid: `failed-${Date.now()}`,
          fromNumber: env.OPENPHONE_PHONE_NUMBER,
          toNumber: input.toNumber,
          status: "failed",
          direction: "outbound",
          startTime: new Date(),
        } as any,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to make a call: ${message}`,
        // Optionally, pass the original error cause
        cause: error,
      });
    }
  });
