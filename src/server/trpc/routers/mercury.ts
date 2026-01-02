import { createTRPCRouter } from "~/server/trpc/main";
import { syncMercuryTransactions } from "../procedures/mercury/syncMercuryTransactions";
import { triggerMercuryPayout } from "../procedures/mercury/triggerMercuryPayout";

export const mercuryRouter = createTRPCRouter({
    syncTransactions: syncMercuryTransactions,
    triggerPayout: triggerMercuryPayout,
});
