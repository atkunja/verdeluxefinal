import "dotenv/config";
import { db } from "./src/server/db";

async function resetRateLimit() {
    const phone = "+12483789067";
    console.log(`Resetting rate limit for ${phone}...`);

    const deleted = await db.otpVerification.deleteMany({
        where: {
            phone: phone,
        },
    });

    console.log(`Deleted ${deleted.count} OTP records. You should be able to try again now.`);
}

resetRateLimit();
