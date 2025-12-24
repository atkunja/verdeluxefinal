import { createTRPCRouter } from "~/server/trpc/main";
import { createCampaign } from "../procedures/marketing/createCampaign";
import { scheduleCampaign } from "../procedures/marketing/scheduleCampaign";

export const marketingRouter = createTRPCRouter({
  createCampaign,
  scheduleCampaign,
});
