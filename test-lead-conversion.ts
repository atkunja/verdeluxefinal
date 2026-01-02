
import { db } from "./src/server/db";
import { appRouter } from "./src/server/trpc/root";

async function testConversion() {
    try {
        console.log("Creating dummy lead...");
        const lead = await db.lead.create({
            data: {
                name: "Test Lead for Conversion",
                email: "test-conversion-lead@example.com",
                phone: "+15550009999",
                source: "MANUAL",
                message: "Test message",
                status: "Incoming"
            }
        });
        console.log(`Created lead ${lead.id}`);

        console.log("Calling convertLeadToClient...");
        const caller = appRouter.createCaller({
            authUser: { id: "1", email: "admin@example.com" },
            profile: { id: 1, role: "ADMIN", email: "admin@example.com" } as any
        });

        const result = await caller.crm.convertLeadToClient({ leadId: lead.id });
        console.log("Conversion Result:", result);

        const user = await db.user.findUnique({ where: { id: result.userId } });
        console.log("Created User:", user?.email, user?.role);

        const updatedLead = await db.lead.findUnique({ where: { id: lead.id } });
        console.log("Updated Lead Status:", updatedLead?.status);

        // Cleanup
        console.log("Cleaning up...");
        await db.lead.delete({ where: { id: lead.id } });
        if (result.isNewUser) {
            await db.user.delete({ where: { id: result.userId } });
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testConversion();
