import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";
import { env } from "~/server/env";

export const uploadBookingImage = baseProcedure
  .input(
    z.object({
      bookingId: z.number(),
      uploaderId: z.number(),
      fileName: z.string(),
      contentType: z.string().optional(),
      fileData: z.string(), // base64
      imageType: z.enum(["BEFORE", "AFTER", "DURING"]),
      caption: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const bucket = env.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos";
    const buffer = Buffer.from(input.fileData, "base64");
    const path = `booking-${input.bookingId}/${Date.now()}-${input.fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: input.contentType || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const signed = await supabaseServer.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24); // 24h
    const image = await db.bookingImage.create({
      data: {
        bookingId: input.bookingId,
        uploaderId: input.uploaderId,
        imageUrl: path, // store path
        imageType: input.imageType,
        caption: input.caption,
      },
    });

    return { ...image, signedUrl: signed.data?.signedUrl };
  });
