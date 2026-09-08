import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { embedQuery } from "./query";

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(
			`Missing environment variable: ${name}. Fill in .env before running this script.`
		);
	}
	return value;
}

const supabase = createClient(
	requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
	requireEnv("SUPABASE_SECRET_KEY"),
	{ realtime: { transport: ws } }
);

async function main() {
	const query = process.argv[2] ?? "A funny romantic movie about relationships";
	console.log(`Query: "${query}"`);

	const embedding = await embedQuery(query);
	console.log(`Embedding generated: ${embedding.length} dimensions`);

	const { data, error } = await supabase.rpc("match_documents", {
		query_embedding: embedding,
		match_count: 5,
	});
	if (error) throw new Error(`Search failed: ${error.message}`);

	console.log("\nTop matches:");
	for (const movie of data) {
		console.log(`- ${movie.title} (${movie.year}) — similarity ${movie.similarity.toFixed(3)}`);
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
