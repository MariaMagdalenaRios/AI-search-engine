import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchMovies } from "./searchMovies";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function recommendMovie(query: string) {
  const movies = await searchMovies(query, 5);

  const movieContext = movies
    .map(
      (movie) =>
        `Title: ${movie.title}
Year: ${movie.year}
Genre: ${movie.genre}
Runtime: ${movie.runtime} minutes
Description: ${movie.content}
Similarity: ${movie.similarity}`
    )
    .join("\n\n");
    const prompt = `
User request:
${query}

Retrieved movies:
${movieContext}

Recommend ONLY one movie from the retrieved movies above.
Do not invent or recommend a movie that is not in the retrieved list.
Explain why your recommendation matches the user's request.
`;

let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    break;
  } catch (error) {
    console.log(`Gemini attempt ${attempt} failed.`);

    if (attempt === 3) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

return response?.text;

}

async function main() {
  const recommendation = await recommendMovie(
    "Recommend a funny romantic movie and explain why."
  );

  console.log(recommendation);
}

main().catch(console.error);