import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { supabaseServer } from "~/server/supabase";
import { env } from "~/server/env";

export const deleteBookingImage = baseProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const bucket = env.STORAGE_BUCKET_BOOKING_PHOTOS || "booking-photos";
    const image = await db.bookingImage.findUnique({ where: { id: input.id } });
    if (image) {
      await supabaseServer.storage.from(bucket).remove([image.imageUrl]);
    }
    await db.bookingImage.delete({ where: { id: input.id } });
    return { success: true };
  });
