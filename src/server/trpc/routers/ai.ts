import { createTRPCRouter } from "~/server/trpc/main";
import { getTranscript } from "../procedures/ai/getTranscript";
import { analyzeCallTranscript } from "../procedures/ai/analyzeCallTranscript";

export const aiRouter = createTRPCRouter({
  getTranscript,
  analyzeCallTranscript,
});
