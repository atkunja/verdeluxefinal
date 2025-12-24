import "dotenv/config.js";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkUser() {
    const user = await db.user.findUnique({
        where: { email: "owner@example.com" },
    });

    if (user) {
        console.log("User found in Prisma DB:");
        console.log("  ID:", user.id);
        console.log("  Email:", user.email);
        console.log("  Role:", user.role);
    } else {
        console.log("User NOT found in Prisma DB!");
        console.log("You need to run the setup script to create the user.");
    }

    await db.$disconnect();
}

checkUser();
