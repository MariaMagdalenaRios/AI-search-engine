import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { embedTexts } from "./embed";

type Movie = {
	title: string;
	year: number;
	genre: string;
	runtime: number;
	overview: string;
};

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(
			`Missing environment variable: ${name}. Fill in .env before running the seed script.`
		);
	}
	return value;
}

const supabase = createClient(
	requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
	requireEnv("SUPABASE_SECRET_KEY"),
	{ realtime: { transport: ws } }
);

async function seed() {
	const movies: Movie[] = JSON.parse(
		readFileSync(join(process.cwd(), "data", "movies.json"), "utf8")
	);

	console.log(`Loaded ${movies.length} movies.`);

	// Build the text to embed: genre gives a coarse signal,
	// overview carries mood words like "heartbreaking" or "hilarious"
	const texts = movies.map((m) => `${m.genre}. ${m.overview}`);

	// Embed in small batches with a pause between each to stay within
	// the free-tier rate limit (quota per minute)
	const BATCH_SIZE = 10;
	const DELAY_MS = 7000; // 7 seconds → ~85 texts/min, safely under the 100/min free tier limit
	const embeddings: number[][] = [];

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);
		console.log(
			`Embedding ${i + 1}–${i + batch.length} of ${texts.length}...`
		);
		const batchEmbeddings = await embedTexts(batch, {
			taskType: "RETRIEVAL_DOCUMENT",
			outputDimensionality: 768,
		});
		embeddings.push(...batchEmbeddings);

		// Pause between batches — skip after the last one
		if (i + BATCH_SIZE < texts.length) {
			await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
		}
	}

	if (embeddings.length !== movies.length) {
		throw new Error(
			`Expected ${movies.length} embeddings, got ${embeddings.length}`
		);
	}

	// Clear existing rows so re-running never creates duplicates
	console.log("Clearing existing rows...");
	const { error: deleteError } = await supabase
		.from("documents")
		.delete()
		.neq("id", 0);
	if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

	// Insert all movies with their embeddings
	const rows = movies.map((movie, i) => ({
		content: texts[i],
		title: movie.title,
		year: movie.year,
		genre: movie.genre,
		runtime: movie.runtime,
		embedding: embeddings[i],
	}));

	console.log("Inserting rows...");
	const { error: insertError } = await supabase.from("documents").insert(rows);
	if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

	console.log(`Done. ${rows.length} movies seeded.`);
}

seed().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
