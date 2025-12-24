import { createTRPCRouter } from "~/server/trpc/main";
import { createTrainingVideo } from "../procedures/training/createTrainingVideo";
import { getTrainingVideos } from "../procedures/training/getTrainingVideos";
import { updateTrainingVideo } from "../procedures/training/updateTrainingVideo";
import { deleteTrainingVideo } from "../procedures/training/deleteTrainingVideo";
import { trackTrainingProgress } from "../procedures/training/trackTrainingProgress";
import { getTrainingProgress } from "../procedures/training/getTrainingProgress";

export const trainingRouter = createTRPCRouter({
  createTrainingVideo,
  getTrainingVideos,
  updateTrainingVideo,
  deleteTrainingVideo,
  trackTrainingProgress,
  getTrainingProgress,
});
