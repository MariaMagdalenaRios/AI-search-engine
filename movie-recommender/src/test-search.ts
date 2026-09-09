import { searchMovies } from "./searchMovies";

type TestCase = {
  label: string;
  query: string;
};

async function main() {
  const customQuery = process.argv[2];
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

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.label} ===`);
    console.log(`Query: "${testCase.query}"`);

    const movies = await searchMovies(testCase.query, 5);

    console.log("Top matches:");

    for (const movie of movies) {
      console.log(
        `- ${movie.title} (${movie.year}) — ${movie.genre} — similarity ${movie.similarity.toFixed(3)}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});