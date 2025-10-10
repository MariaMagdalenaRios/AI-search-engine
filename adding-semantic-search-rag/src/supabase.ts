import { createClient } from "@supabase/supabase-js";

import "dotenv/config";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error("Missing environment variables");
}

export const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_ANON_KEY!,
);

// Use service role on the server for inserts/seeding (NEVER ship this to the browser)
export const supabaseAdmin = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
