import { requireAuth } from "~/server/trpc/main";

export const getSession = requireAuth.query(async ({ ctx }) => {
  const { profile } = ctx;
  return { user: profile }; // profile is injected by auth middleware
});
