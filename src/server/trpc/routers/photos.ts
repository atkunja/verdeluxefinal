import { createTRPCRouter } from "~/server/trpc/main";
import { uploadBookingImage } from "../procedures/photos/uploadBookingImage";
import { getBookingImages } from "../procedures/photos/getBookingImages";
import { deleteBookingImage } from "../procedures/photos/deleteBookingImage";
import { createSignedUpload } from "../procedures/photos/createSignedUpload";
import { savePhotoRecord } from "../procedures/photos/savePhotoRecord";

export const photosRouter = createTRPCRouter({
  uploadBookingImage,
  getBookingImages,
  deleteBookingImage,
  createSignedUpload,
  savePhotoRecord,
});
