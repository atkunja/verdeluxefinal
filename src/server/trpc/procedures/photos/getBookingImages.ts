import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";
import { env } from "~/server/env";

export const getBookingImages = baseProcedure
  .input(z.object({ bookingId: z.number() }))
  .query(async ({ input }) => {
    const bucket = env.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos";
    console.log("[getBookingImages] Bucket:", bucket, "Supabase initialized:", !!supabaseServer);

    const images = await db.bookingImage.findMany({
      where: { bookingId: input.bookingId },
      orderBy: { createdAt: "desc" },
    });

    console.log("[getBookingImages] Found", images.length, "images for booking", input.bookingId);

    const withUrls = await Promise.all(
      images.map(async (img) => {
        console.log("[getBookingImages] Processing image:", img.id, "path:", img.imageUrl);
        try {
          if (!supabaseServer) {
            console.error("[getBookingImages] Supabase server not initialized!");
            return { ...img, signedUrl: null };
          }
          const signed = await supabaseServer.storage.from(bucket).createSignedUrl(img.imageUrl, 60 * 60 * 24);
          if (signed.error) {
            console.error(`[getBookingImages] Failed to create signed URL for image ${img.id}:`, signed.error.message);
            return { ...img, signedUrl: null };
          }
          console.log("[getBookingImages] Generated signed URL for image", img.id);
          return { ...img, signedUrl: signed.data?.signedUrl ?? null };
        } catch (err: any) {
          console.error(`[getBookingImages] Error generating signed URL for image ${img.id}:`, err.message);
          return { ...img, signedUrl: null };
        }
      })
    );

    return withUrls;
  });


