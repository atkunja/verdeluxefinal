import { z } from "zod";
import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const createChecklistTemplate = requireAdmin
  .input(
    z.object({
      name: z.string().min(1, "Template name is required"),
      serviceType: z.string().min(1, "Service type is required"),
      items: z.array(
        z.object({
          description: z.string().min(1, "Item description is required"),
          order: z.number().int().nonnegative(),
        })
      ).min(1, "At least one checklist item is required"),
    })
  )
  .mutation(async ({ input }) => {
    const template = await db.checklistTemplate.create({
      data: {
        name: input.name,
        serviceType: input.serviceType,
        items: {
          create: input.items.map((item) => ({
            description: item.description,
            order: item.order,
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return { template };
  });
