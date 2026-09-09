import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(
			`Missing environment variable: ${name}. Fill in .env before running this script.`
		);
	}
	return value;
}

export const supabase = createClient(
	requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
	requireEnv("SUPABASE_SECRET_KEY")
);
