
import { db } from "../src/server/db";

async function verifyPermissions() {
    console.log("Starting Permission Verification...");
    const testEmail = "test-perm-verify@example.com";

    try {
        // 1. Cleanup
        await db.user.deleteMany({ where: { email: testEmail } });
        console.log("Cleaned up previous test users.");

        // 2. Create as ADMIN with Bookings permission
        console.log("Creating ADMIN with manage_bookings: true...");
        const admin = await db.user.create({
            data: {
                email: testEmail,
                password: "hashedpassword123",
                role: "ADMIN",
                firstName: "Test",
                lastName: "Admin",
                adminPermissions: { manage_bookings: true, manage_customers: true },
                // Simulate Supabase ID bypass for this test since we are testing local DB persistence
            },
        });

        const verify1 = admin.adminPermissions as Record<string, boolean>;
        if (!verify1?.manage_bookings) {
            throw new Error("Failed! manage_bookings should be true.");
        }
        console.log("✅ Created with manage_bookings: true.");

        // 3. Update to REMOVE Bookings permission
        console.log("Updating: Removing manage_bookings...");
        const updated = await db.user.update({
            where: { id: admin.id },
            data: {
                adminPermissions: { manage_bookings: false, manage_customers: true },
            },
            select: { adminPermissions: true }, // Verify select return too
        });

        const verify2 = updated.adminPermissions as Record<string, boolean>;
        if (verify2?.manage_bookings === true) {
            throw new Error(`Failed! manage_bookings is ${verify2.manage_bookings}, expected false.`);
        }
        console.log("✅ Updated: manage_bookings is now false.");

        // 4. Verify DB persistence independent of return
        const fetched = await db.user.findUnique({ where: { id: admin.id } });
        const verify3 = fetched?.adminPermissions as Record<string, boolean>;
        if (verify3?.manage_bookings === true) {
            throw new Error("Failed persistence! DB still has true.");
        }
        console.log("✅ DB verified persistence.");

        // 5. Cleanup
        await db.user.delete({ where: { id: admin.id } });
        console.log("✅ Cleanup successful.");

        console.log("\n🎉 ALL PERMISSION CHECKS PASSED!");
    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error);
        process.exit(1);
    }
}

verifyPermissions();
