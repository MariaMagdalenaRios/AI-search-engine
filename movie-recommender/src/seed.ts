import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

type CachedMovie = Movie & {
	text: string;
	embedding: number[];
};

const CACHE_PATH = join(process.cwd(), "data", "movies-with-embeddings.json");
const MOVIES_PATH = join(process.cwd(), "data", "movies.json");

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

// --generate: call Gemini and save vectors to cache file
async function generate(): Promise<CachedMovie[]> {
	const movies: Movie[] = JSON.parse(readFileSync(MOVIES_PATH, "utf8"));
	console.log(`Loaded ${movies.length} movies. Calling Gemini...`);

	const texts = movies.map((m) => `${m.genre}. ${m.overview}`);

	// Small batches + pause to stay under free-tier rate limit (100 texts/min)
	const BATCH_SIZE = 10;
	const DELAY_MS = 7000;
	const embeddings: number[][] = [];

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);
		console.log(`Embedding ${i + 1}–${i + batch.length} of ${texts.length}...`);
		const batchEmbeddings = await embedTexts(batch, {
			taskType: "RETRIEVAL_DOCUMENT",
			outputDimensionality: 768,
		});
		embeddings.push(...batchEmbeddings);
		if (i + BATCH_SIZE < texts.length) {
			await new Promise((r) => setTimeout(r, DELAY_MS));
		}
	}

	if (embeddings.length !== movies.length) {
		throw new Error(`Expected ${movies.length} embeddings, got ${embeddings.length}`);
	}

	const cached: CachedMovie[] = movies.map((movie, i) => ({
		...movie,
		text: texts[i],
		embedding: embeddings[i],
	}));

	writeFileSync(CACHE_PATH, JSON.stringify(cached, null, 2), "utf8");
	console.log(`Saved vectors to ${CACHE_PATH}`);
	return cached;
}

// Load from cache file — no API calls
function loadCache(): CachedMovie[] {
	if (!existsSync(CACHE_PATH)) {
		throw new Error(
			`Cache file not found: ${CACHE_PATH}\n` +
			`Run "npm run seed:generate" first to generate and save the embeddings.`
		);
	}
	const cached: CachedMovie[] = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
	console.log(`Loaded ${cached.length} movies from cache.`);
	return cached;
}

async function insertIntoSupabase(cached: CachedMovie[]) {
	console.log("Clearing existing rows...");
	const { error: deleteError } = await supabase
		.from("documents")
		.delete()
		.neq("id", 0);
	if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

	const rows = cached.map((m) => ({
		content: m.text,
		title: m.title,
		year: m.year,
		genre: m.genre,
		runtime: m.runtime,
		embedding: m.embedding,
	}));

	console.log("Inserting rows...");
	const { error: insertError } = await supabase.from("documents").insert(rows);
	if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

	console.log(`Done. ${rows.length} movies seeded.`);
}

async function main() {
	const useGenerate = process.argv.includes("--generate");

	if (useGenerate) {
		const cached = await generate();
		await insertIntoSupabase(cached);
	} else {
		const cached = loadCache();
		await insertIntoSupabase(cached);
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
