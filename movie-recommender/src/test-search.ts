import { searchMovies } from "./searchMovies";

async function main() {
	const movies = await searchMovies(
		"A funny romantic movie about relationships",
		5
	);

	console.log("\nsearchMovies results:");
	console.log(movies);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});