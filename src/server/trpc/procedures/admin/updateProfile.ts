import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const updateProfile = baseProcedure
    .input(
        z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1),
        })
    )
    .mutation(async ({ input, ctx }) => {
        const userId = ctx.profile?.id;
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
            },
        });

        return {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
        };
    });
