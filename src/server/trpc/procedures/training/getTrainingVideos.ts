import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getTrainingVideos = baseProcedure.query(async () => {
  const videos = await db.trainingVideo.findMany();
  return videos;
});
