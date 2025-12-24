import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { mercuryFetch } from "~/server/mercury/client";
import { normalizeDetroitRange } from "~/utils/dateRange";

export const listTransactions = requireAdmin
  .input(
    z
      .object({
        limit: z.number().int().positive().max(100).optional().default(50),
        page: z.number().int().positive().optional().default(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional()
  )
  .query(async ({ input }) => {
    const params = new URLSearchParams();
    const limit = input?.limit ?? 50;
    const page = input?.page ?? 1;
    params.set("per_page", limit.toString());
    params.set("page", page.toString());
    if (input?.startDate) params.set("start_date", input.startDate);
    if (input?.endDate) params.set("end_date", input.endDate);

    let data: any;
    try {
      data = await mercuryFetch<any>(`/v1/transactions?${params.toString()}`);
    } catch (err: any) {
      // Graceful fallback when sandbox has no data or key invalid
      return { transactions: [], error: err?.message || "Mercury transactions unavailable" };
    }

    const parsed = (data?.transactions || data?.data || []).map((t: any) => {
      let bookingId: number | null = null;
      const desc = (t.description || t.memo || "").toString();
      const match = desc.match(/#(\d+)/);
      if (match) bookingId = Number(match[1]);
      return {
        ...t,
        bookingId,
      };
    });

    // Apply Detroit-inclusive range post-fetch for safety if API ignores filters
    if (input?.startDate || input?.endDate) {
      const range = normalizeDetroitRange(input?.startDate, input?.endDate);
      const within = (d: string | Date | null | undefined) => {
        if (!d) return false;
        const date = typeof d === "string" ? new Date(d) : d;
        if (range.start && date < range.start) return false;
        if (range.end && date > range.end) return false;
        return true;
      };
      return {
        transactions: parsed.filter((t: any) => within(t.transactionAt || t.date || t.created_at)),
      };
    }

    return { transactions: parsed };
  });
