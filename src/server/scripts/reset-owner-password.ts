import "dotenv/config.js";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function resetOwnerPassword() {
    const email = "owner@example.com";
    const newPassword = env.ADMIN_PASSWORD;

    console.log(`Resetting password for ${email} to ADMIN_PASSWORD...`);

    // Find the user
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });

    if (listError) {
        throw listError;
    }

    const user = listData?.users?.find((u) => u.email === email);
    if (!user) {
        console.error(`User ${email} not found in Supabase Auth`);
        process.exit(1);
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
    });

    if (updateError) {
        throw updateError;
    }

    console.log(`✅ Password reset successfully for ${email}`);
    console.log(`   You can now login with: ${email} / ${newPassword}`);
}

resetOwnerPassword().catch((err) => {
    console.error(err);
    process.exit(1);
});
