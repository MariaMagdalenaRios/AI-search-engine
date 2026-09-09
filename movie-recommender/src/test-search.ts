import { embedQuery } from "./query";
import { searchDocuments } from "./search";

async function main() {
	const query = process.argv[2] ?? "A funny romantic movie about relationships";
	console.log(`Query: "${query}"`);

	const embedding = await embedQuery(query);
	console.log(`Embedding generated: ${embedding.length} dimensions`);

	const movies = await searchDocuments(embedding, 5);

	console.log("\nTop matches:");
	for (const movie of movies) {
		console.log(`- ${movie.title} (${movie.year}) — similarity ${movie.similarity.toFixed(3)}`);
	}
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
