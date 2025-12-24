import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";
import { env } from "~/server/env";

export const getBookingImages = baseProcedure
  .input(z.object({ bookingId: z.number() }))
  .query(async ({ input }) => {
    const bucket = env.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos";
    const images = await db.bookingImage.findMany({
      where: { bookingId: input.bookingId },
    });

    const withUrls = await Promise.all(
      images.map(async (img) => {
        const signed = await supabaseServer.storage.from(bucket).createSignedUrl(img.imageUrl, 60 * 60 * 24);
        return { ...img, signedUrl: signed.data?.signedUrl };
      })
    );

    return withUrls;
  });
