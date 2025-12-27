import { db } from "~/server/db";
import { middleware } from "~/server/trpc/trpc";

export const auditLogMiddleware = middleware(async ({ path, type, next, ctx }) => {
  // This is a basic implementation. A more robust solution would involve
  // getting the 'before' state of the data and diffing it with the 'after' state.
  const result = await next();

  if (type === 'mutation' && result.ok) {
    const { profile: user } = ctx;
    if (user?.id) {
      await db.systemLog.create({
        data: {
          user: { connect: { id: user.id } },
          action: path,
          entity: path.split('.')[0] ?? 'unknown',
          entityId: (result.data as any)?.id ?? undefined,
          after: result.data as any,
        },
      });
    }
  }

  return result;
});
