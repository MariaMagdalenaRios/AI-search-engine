import { searchMovies } from "./searchMovies";

type TestCase = {
  label: string;
  query: string;
};

async function main() {
  // Hämtar en egen sökning från terminalen om användaren har skrivit in en
  const customQuery = process.argv[2];

  // Om det finns en egen sökning testas bara den, annars används våra testfall
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

  // Går igenom alla testfallen och testar searchMovies med varje sökning
  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.label} ===`);
    console.log(`Query: "${testCase.query}"`);

    // Hämtar de fem filmer som passar bäst med sökningen
    const movies = await searchMovies(testCase.query, 5);

    console.log("Top matches:");

    // Skriver ut information och similarity-värdet för varje film
    for (const movie of movies) {
      console.log(
        `- ${movie.title} (${movie.year}) — ${movie.genre} — similarity ${movie.similarity.toFixed(3)}`
      );
    }
  }
}

// Kör testet och stänger programmet med felkod 1 om något går fel
main().catch((err) => {
  console.error(err);
  process.exit(1);
});