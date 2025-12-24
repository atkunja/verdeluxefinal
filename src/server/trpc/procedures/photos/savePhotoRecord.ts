import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const savePhotoRecord = baseProcedure
  .input(
    z.object({
      bookingId: z.number(),
      uploaderId: z.number(),
      path: z.string(),
      imageType: z.enum(["BEFORE", "AFTER", "DURING"]),
      caption: z.string().optional(),
      contentType: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const image = await db.bookingImage.create({
      data: {
        bookingId: input.bookingId,
        uploaderId: input.uploaderId,
        imageUrl: input.path,
        imageType: input.imageType,
        caption: input.caption,
      },
    });
    return image;
  });
