export type PaymentTimelineEntry = {
  label: string;
  amount?: number;
  status?: string;
  createdAt?: Date | string | null;
  kind: "charge" | "hold" | "refund";
};

export function buildPaymentTimeline({
  charges,
  holds,
  refunds,
}: {
  charges: any[];
  holds: any[];
  refunds?: any[];
}): PaymentTimelineEntry[] {
  const entries: PaymentTimelineEntry[] = [];
  charges.forEach((c: any) =>
    entries.push({
      label: c.description || "Charge",
      amount: c.amount,
      status: c.status,
      createdAt: c.created,
      kind: "charge",
    })
  );
  holds.forEach((h: any) =>
    entries.push({
      label: h.description || "Hold",
      amount: h.amount,
      status: h.status,
      createdAt: h.created,
      kind: "hold",
    })
  );
  (refunds || []).forEach((r: any) =>
    entries.push({
      label: r.description || "Refund",
      amount: r.amount,
      status: r.status,
      createdAt: r.created,
      kind: "refund",
    })
  );
  return entries.sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
    return db - da;
  });
}
