import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { supabaseServer } from "~/server/supabase";
import { env } from "~/server/env";

export const createSignedUpload = baseProcedure
  .input(z.object({ bookingId: z.number(), fileName: z.string(), contentType: z.string() }))
  .mutation(async ({ input }) => {
    const bucket = env.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos";
    const path = `booking-${input.bookingId}/${Date.now()}-${input.fileName}`;

    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false,
        contentType: input.contentType,
      });

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Unable to create upload URL");
    }

    return { path, signedUrl: data.signedUrl, token: data.token }; // token for POST body
  });
