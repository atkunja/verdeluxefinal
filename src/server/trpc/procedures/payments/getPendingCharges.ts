import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getPendingCharges = requireAdmin.query(async () => {
    const bookings = await db.booking.findMany({
        where: {
            status: "COMPLETED",
        },
        include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true } },
            payments: { select: { amount: true, paidAt: true } },
        },
        orderBy: { scheduledDate: "desc" },
    });

    // Filter for bookings with a remaining balance
    const pending = bookings.filter((booking) => {
        const totalPaid = booking.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
        return (booking.finalPrice || 0) > totalPaid;
    });

    return pending.map((booking) => {
        const totalPaid = booking.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
        return {
            id: booking.id.toString(),
            customer: {
                id: booking.clientId,
                name: `${booking.client.firstName} ${booking.client.lastName}`,
                email: booking.client.email,
            },
            amount: (booking.finalPrice || 0) - totalPaid,
            serviceType: booking.serviceType,
            serviceDate: new Date(booking.scheduledDate).toLocaleDateString(),
            serviceTime: booking.scheduledTime,
            location: booking.address,
        };
    });
});
