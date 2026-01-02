
import { db } from "../src/server/db";

async function inspectUser() {
    const email = "atkunjadia@gmail.com";
    console.log(`Inspecting user: ${email}`);

    const user = await db.user.findFirst({
        where: {
            email: {
                equals: email,
                mode: "insensitive",
            },
        },
    });

    if (!user) {
        console.log("User not found!");
    } else {
        console.log("User found:");
        console.log("ID:", user.id);
        console.log("Role:", user.role);
        console.log("Admin Permissions:", JSON.stringify(user.adminPermissions, null, 2));
    }
}

inspectUser();
