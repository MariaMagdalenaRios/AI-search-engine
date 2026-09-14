import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { searchMovies } from "./searchMovies";

// Create the Gemini AI client using the API key stored in the .env file. 
// The API key is kept outside the source code for security reasons.

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates a movie recommendation using semantic search and Gemini.
 * The function first uses semantic search to find the five movies
 * that are most similar to the user's request. These movies are then
 * given to Gemini as context. Gemini is instructed to choose only
 * one movie from the retrieved results and explain the recommendation.
 *
 * This creates a RAG-like flow:
 * 1. Retrieve relevant movies using semantic search.
 * 2. Give the retrieved information to the LLM.
 * 3. Generate a natural-language recommendation.
 */

async function recommendMovie(query: string) {
  // Retrieve the five most semantically similar movies 
  // from Supabase using the user's natural-language query.
  const movies = await searchMovies(query, 5);

  // Convert the retrieved movie data into text that Gemini 
  // can use as context when generating its recommendation.
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
    // The prompt gives Gemini both the user's request and the 
    // movies retrieved by semantic search. 
    // The instructions are important because they reduce the risk 
    // of Gemini inventing a movie that is not in our database.
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
// Try the Gemini request up to three times. 
// This makes the application more robust if the API temporarily 
// returns an error, for example because of high demand.

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      // Gemini is used as the LLM that generates the final 
      // recommendation and explanation.
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // Stop retrying when the request succeeds.
    break;
  } catch (error) {
    console.log(`Gemini attempt ${attempt} failed.`);

    // If all three attempts fail, pass the error to the caller.
    if (attempt === 3) {
      throw error;
    }
    // If all three attempts fail, pass the error to the caller.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
// Return Gemini's generated recommendation.
return response?.text;

}

/** 
* Test the recommendation function with an example query. 
*/

async function main() {
  const recommendation = await recommendMovie(
    "Recommend a funny romantic movie and explain why."
  );

  console.log(recommendation);
}
// Start the application and print any unexpected errors.
main().catch(console.error);