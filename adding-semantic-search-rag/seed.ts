declare const require: {
	(id: string): any;
};

declare const process: {
	env: Record<string, string | undefined>;
	exit(code?: number): never;
}

const { config: dotenvConfig } = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

type Movie = {
	title: string;
	year: number;
	genre: string;
	runtime: number;
	overview: string;
};

const movies: Movie[] = require("../movie-recommender/data/movies.json");

dotenvConfig();

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0 || value === "..." || value.startsWith("your_")) {
		throw new Error(`Missing or placeholder ${name}. Set a real value in .env before running the seed script.`);
	}
	return value;
}

requireEnv("GEMINI_API_KEY");

const { embedTexts } = require("./src/embed");

const supabase = createClient(
	requireEnv("SUPABASE_URL"),
	requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);

async function seed() {
	console.log(`Seeding ${movies.length} movies...`);

    // Create the text that will be embedded
	const texts = movies.map(
		(movie) => `${movie.genre}. ${movie.overview}`
	);
    console.log("Generating embeddings...");

    // Gemini allows a maximum of 100 embeddings per request, so we need to batch the requests
    const batchSize = 100;
    const embeddings: number[][] = [];  

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await embedTexts(batch, { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 }   
        );

        embeddings.push(...batchEmbeddings);
    }

    if (embeddings.length !== movies.length) {
        throw new Error(`Expected ${movies.length} embeddings, but got ${embeddings.length}`);
    }

    // Prepare rows for the Supabase table

    const rows = movies.map((movie, index) => ({
        content: texts[index],
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        runtime: movie.runtime,
        embedding: embeddings[index],
    }));

    console.log("Inserting rows into Supabase...");
    const { error } = await supabase.from("documents").insert(rows);

    if (error) {
        throw new Error(`Failed to insert rows into Supabase: ${error.message}`);
    }

    console.log(`Seeding completed ${movies.length} rows successfully.`);
   
}

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});