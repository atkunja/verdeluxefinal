import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getChecklistTemplates = requireAdmin.query(async () => {
  const templates = await db.checklistTemplate.findMany({
    include: {
      items: {
        orderBy: {
          order: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { templates };
});
