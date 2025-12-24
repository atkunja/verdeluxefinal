import "dotenv/config.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    console.log("Testing login with owner@example.com / devadmin...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: "owner@example.com",
        password: "devadmin",
    });

    if (error) {
        console.error("Login failed:", error.message);
        console.error("Error code:", error.status);
    } else {
        console.log("Login successful!");
        console.log("User ID:", data.user?.id);
    }
}

testLogin();
