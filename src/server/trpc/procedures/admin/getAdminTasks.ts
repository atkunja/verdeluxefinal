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

    const tasks: {
        id: string;
        title: string;
        description: string;
        time: string;
        color: string;
        actionUrl: string;
        icon: string;
    }[] = [];

    // Generate unassigned tasks - RED theme
    unassignedBookings.forEach((b) => {
        tasks.push({
            id: `unassigned-${b.id}`,
            title: "Unassigned Job",
            description: `${b.serviceType} at ${b.address.split(",")[0]} needs a cleaner.`,
            time: "ASAP",
            color: "bg-red-100 text-red-700 border-red-200",
            actionUrl: "/admin-portal/bookings",
            icon: "user-plus",
        });
    });

    // Generate lead tasks - BLUE theme
    newLeads.forEach((l) => {
        tasks.push({
            id: `lead-${l.id}`,
            title: "New Lead",
            description: `${l.name} sent an inquiry via ${l.source}.`,
            time: "NEW",
            color: "bg-blue-100 text-blue-700 border-blue-200",
            actionUrl: "/admin-portal/leads",
            icon: "mail",
        });
    });

    // Generate payment tasks - AMBER theme
    completedBookings.forEach((b) => {
        const totalPaid = b.payments.reduce((sum, p) => (p.paidAt ? sum + p.amount : sum), 0);
        if ((b.finalPrice || 0) > totalPaid) {
            tasks.push({
                id: `charge-${b.id}`,
                title: "Pending Charge",
                description: `Completed job for ${b.client.firstName} is ready to be charged.`,
                time: "ACTION",
                color: "bg-amber-100 text-amber-700 border-amber-200",
                actionUrl: "/admin-portal/bookings",
                icon: "credit-card",
            });
        }
    });

    return tasks;
});
