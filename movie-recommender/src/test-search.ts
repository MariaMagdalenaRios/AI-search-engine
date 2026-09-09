import { searchMovies } from "./searchMovies";

async function main() {
  const query =
    process.argv[2] ?? "A funny romantic movie about relationships";

  console.log(`\nQuery: "${query}"`);

  const movies = await searchMovies(query, 5);

  console.log("\nTop matches:");

  for (const movie of movies) {
    console.log(
      `- ${movie.title} (${movie.year}) — ${movie.genre} — similarity ${movie.similarity.toFixed(3)}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});