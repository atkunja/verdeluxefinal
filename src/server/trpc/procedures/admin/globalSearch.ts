import { z } from "zod";
import { requireAdmin } from "~/server/trpc/main";
import { db } from "~/server/db";

export const globalSearch = requireAdmin
    .input(z.object({
        query: z.string().min(1),
    }))
    .query(async ({ input }) => {
        const q = input.query;

        const [users, bookings, leads] = await Promise.all([
            // Search Users (Customers)
            db.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: q, mode: "insensitive" } },
                        { lastName: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { phone: { contains: q, mode: "insensitive" } },
                    ],
                },
                take: 5,
                orderBy: { createdAt: "desc" },
            }),
            // Search Bookings
            db.booking.findMany({
                where: {
                    OR: [
                        { address: { contains: q, mode: "insensitive" } },
                        { id: isNaN(Number(q)) ? undefined : Number(q) },
                    ].filter(Boolean) as any,
                },
                include: { client: true },
                take: 5,
                orderBy: { createdAt: "desc" },
            }),
            // Search Leads
            db.lead.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { phone: { contains: q, mode: "insensitive" } },
                    ],
                },
                take: 5,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const results = [
            ...users.map(u => ({
                id: `user-${u.id}`,
                type: "Customer",
                title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
                subtitle: u.email,
                link: `/admin-portal/communications?phone=${u.phone || ""}`,
            })),
            ...bookings.map(b => ({
                id: `booking-${b.id}`,
                type: "Booking",
                title: `#${b.id} - ${b.address}`,
                subtitle: `${b.client.firstName} ${b.client.lastName}`,
                link: `/admin-portal/bookings`,
            })),
            ...leads.map(l => ({
                id: `lead-${l.id}`,
                type: "Lead",
                title: l.name,
                subtitle: `${l.status} - ${l.email}`,
                link: `/admin-portal/leads`,
            })),
        ];

        return results;
    });
