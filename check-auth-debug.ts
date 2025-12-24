import "dotenv/config.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuth() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error);
        return;
    }
    const user = data.users.find(u => u.email === "owner@example.com");
    if (user) {
        console.log("Owner user found in Supabase Auth:", user.id);
    } else {
        console.log("Owner user NOT found in Supabase Auth!");
    }
}

checkAuth();
