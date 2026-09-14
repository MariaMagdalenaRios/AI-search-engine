import { searchMovies } from "./searchMovies";
// Defines the structure of a semantic search test case. 
// Each test has a label for the console output and a natural-language query.
type TestCase = {
  label: string;
  query: string;
};
/** 
 * Tests the semantic movie search with different types of queries. 
 * 
 * The script can either: 
 * 1. Run a predefined set of test queries. 
 * 2. Run one custom query provided from the command line. 
 *  
 * This makes it easier to evaluate whether semantic search returns
 * relevant movies for different types of user requests. 
 */
async function main() {
	// Check if the user provided a custom query when starting the script.
	// Example: 
	// npm run test:search -- "a dark psychological thriller"
  const customQuery = process.argv[2];
  // If a custom query was provided, only test that query. 
  // Otherwise, run the predefined test cases.
  const testCases: TestCase[] = customQuery
    ? [{ label: "Custom query", query: customQuery }]
    : [
      {
        label: "Thriller",
        query: "a tense thriller with twists, suspense, and danger",
      },
      {
        label: "Space adventure",
        query: "an exciting space adventure with aliens and exploration",
      },
      {
        label: "Uplifting",
        query: "an uplifting story about hope, friendship, and growth",
      },
      {
        label: "Romantic comedy",
        query: "a funny romantic movie about relationships",
      },
    ];
  // Run each test case one at a time.
  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.label} ===`);
    console.log(`Query: "${testCase.query}"`);
	// Search for the five movies that are most semantically similar 
	// to the current test query.
    const movies = await searchMovies(testCase.query, 5);

    console.log("Top matches:");
	// Display the results and their similarity scores.
    for (const movie of movies) {
      console.log(
        `- ${movie.title} (${movie.year}) — ${movie.genre} — similarity ${movie.similarity.toFixed(3)}`
      );
    }
  }
}
// Run the tests and handle unexpected errors.
main().catch((err) => {
  console.error(err);
  process.exit(1);
});