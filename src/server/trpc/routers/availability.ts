import { createTRPCRouter } from "~/server/trpc/main";
import { setCleanerAvailability } from "../procedures/availability/setCleanerAvailability";
import { getCleanerAvailability } from "../procedures/availability/getCleanerAvailability";
import { getAllCleanerAvailability } from "../procedures/admin/getAllCleanerAvailability";

export const availabilityRouter = createTRPCRouter({
  setCleanerAvailability,
  getCleanerAvailability,
  getAllCleanerAvailability,
});
