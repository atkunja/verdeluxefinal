import { requireAdmin } from "~/server/trpc/main";
import { mercuryFetch } from "~/server/mercury/client";

export const listAccounts = requireAdmin.query(async () => {
  try {
    const data = await mercuryFetch<any>("/v1/accounts");
    return data;
  } catch (err: any) {
    // If Mercury sandbox has no accounts or key is invalid, return empty list to avoid hard crash
    return { accounts: [], error: err?.message || "Mercury accounts unavailable" };
  }
});
