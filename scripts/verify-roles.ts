
import { db } from "../src/server/db";

async function verifyRoles() {
    console.log("Starting Role Verification...");
    const testEmail = "test-role-verify@example.com";

    try {
        // 1. Cleanup
        await db.user.deleteMany({ where: { email: testEmail } });
        console.log("Cleaned up previous test users.");

        // 2. Create as CLEANER
        console.log("Creating user with role CLEANER...");
        const cleaner = await db.user.create({
            data: {
                email: testEmail,
                password: "hashedpassword123",
                role: "CLEANER",
                firstName: "Test",
                lastName: "Cleaner",
            },
        });

        if (cleaner.role !== "CLEANER") {
            throw new Error(`Failed! Expected CLEANER, got ${cleaner.role}`);
        }
        console.log("✅ Created user is correctly a CLEANER.");

        // 3. Update to CLIENT
        console.log("Updating role to CLIENT...");
        const client = await db.user.update({
            where: { id: cleaner.id },
            data: { role: "CLIENT" },
        });

        if (client.role !== "CLIENT") {
            throw new Error(`Failed! Expected CLIENT, got ${client.role}`);
        }
        console.log("✅ User effectively updated to CLIENT.");

        // 4. Update to ADMIN
        console.log("Updating role to ADMIN...");
        const admin = await db.user.update({
            where: { id: cleaner.id },
            data: { role: "ADMIN" },
        });

        if (admin.role !== "ADMIN") {
            throw new Error(`Failed! Expected ADMIN, got ${admin.role}`);
        }
        console.log("✅ User effectively updated to ADMIN.");

        // 5. Cleanup
        await db.user.delete({ where: { id: cleaner.id } });
        console.log("✅ Cleanup successful.");

        console.log("\n🎉 ALL ROLE CHECKS PASSED!");
    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error);
        process.exit(1);
    }
}

verifyRoles();
