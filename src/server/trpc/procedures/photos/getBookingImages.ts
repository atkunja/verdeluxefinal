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
      orderBy: { createdAt: "desc" },
    });

    const withUrls = await Promise.all(
      images.map(async (img) => {
        try {
          if (!supabaseServer) {
            console.error("Supabase server not initialized");
            return { ...img, signedUrl: null };
          }
          const signed = await supabaseServer.storage.from(bucket).createSignedUrl(img.imageUrl, 60 * 60 * 24);
          if (signed.error) {
            console.error(`Failed to create signed URL for image ${img.id}:`, signed.error.message);
            return { ...img, signedUrl: null };
          }
          return { ...img, signedUrl: signed.data?.signedUrl ?? null };
        } catch (err: any) {
          console.error(`Error generating signed URL for image ${img.id}:`, err.message);
          return { ...img, signedUrl: null };
        }
      })
    );

    return withUrls;
  });

