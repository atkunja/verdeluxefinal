
import { db } from "./src/server/db";

async function checkUser() {
    const phoneSegment = "3137470217";
    const user = await db.user.findFirst({
        where: { phone: { contains: phoneSegment } }
    });
    const lead = await db.lead.findFirst({
        where: { phone: { contains: phoneSegment } }
    });

    console.log("Results for " + phoneSegment + ":", {
        user: user ? { id: user.id, name: user.firstName + " " + user.lastName, phone: user.phone } : null,
        lead: lead ? { id: lead.id, name: lead.name, phone: lead.phone } : null
    });
}

checkUser();
