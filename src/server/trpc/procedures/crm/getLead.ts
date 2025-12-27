import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";

export const getLead = requireAdmin
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.leadId },
        });

        if (!lead) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Lead not found",
            });
        }

        return { lead };
    });
