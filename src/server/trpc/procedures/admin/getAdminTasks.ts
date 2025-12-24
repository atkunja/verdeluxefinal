import { db } from "~/server/db";
import { requireAdmin } from "~/server/trpc/main";

export const getAdminTasks = requireAdmin.query(async () => {
    const unassignedBookings = await db.booking.findMany({
        where: {
            cleanerId: null,
            status: { not: "CANCELLED" },
        },
        include: { client: true },
        take: 5,
    });

    const newLeads = await db.lead.findMany({
        where: { status: "new" },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const completedBookings = await db.booking.findMany({
        where: { status: "COMPLETED" },
        include: { payments: true, client: true },
    });

    const tasks: { id: string; title: string; description: string; time: string; color: string }[] = [];

    // Generate unassigned tasks
    unassignedBookings.forEach((b) => {
        tasks.push({
            id: `unassigned-${b.id}`,
            title: "Unassigned Job",
            description: `${b.serviceType} at ${b.address.split(",")[0]} needs a cleaner.`,
            time: "Asap",
            color: "bg-red-100 text-red-700",
        });
    });

    // Generate lead tasks
    newLeads.forEach((l) => {
        tasks.push({
            id: `lead-${l.id}`,
            title: "New Lead",
            description: `${l.name} sent an inquiry via ${l.source}.`,
            time: "New",
            color: "bg-blue-100 text-blue-700",
        });
    });

    // Generate payment tasks
    completedBookings.forEach((b) => {
        const totalPaid = b.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
        if ((b.finalPrice || 0) > totalPaid) {
            tasks.push({
                id: `charge-${b.id}`,
                title: "Pending Charge",
                description: `Completed job for ${b.client.firstName} is ready to be charged.`,
                time: "Action Required",
                color: "bg-green-100 text-green-700",
            });
        }
    });

    return tasks;
});
