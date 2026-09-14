import "dotenv/config";
import { embedTexts } from "./embed";
import { supabase } from "./supabase";
// Defines the structure of a movie returned from the semantic search.
type MovieSearchResult = {
	id: number;
	content: string;
	title: string;
	year: number;
	genre: string;
	runtime: number;
	similarity: number;
};
/** 
* Searches for movies that are semantically similar to a user's query. 
* 
* The function converts the user's query into an embedding using Gemini.
* The embedding is then sent to Supabase, where pgvector compares it 
* with the movie embeddings stored in the database.
* 
* @param query - The user's natural-language search query. 
* @param k - The maximum number of movies to return. Defaults to 3. 
* @returns An array of movies ranked by semantic similarity. 
*/
export async function searchMovies(
	query: string,
	k = 3
): Promise<MovieSearchResult[]> {
	try {
		// Make sure the user has entered a non-empty search query.
		if (!query.trim()) {
			throw new Error("Search query cannot be empty.");
		}
		// Convert the user's query into an embedding. 
		// RETRIEVAL_QUERY tells Gemini that this embedding will be 
		// used to search for relevant documents/movies. 
		// The output has 768 dimensions to match the database vector size.
		
		const [queryEmbedding] = await embedTexts([query], {
			taskType: "RETRIEVAL_QUERY",
			outputDimensionality: 768,
		});
		// Make sure an embedding was successfully generated 
		// before sending the search request to Supabase.
		if (!queryEmbedding) {
			throw new Error("Could not generate query embedding.");
		}

		// Use the query embedding to search the Supabase documents table. 
		// The match_documents() database function uses pgvector to find 
		// the movies with the closest vector representations. 
		// The search is limited to the top `k` results.
		const { data, error } = await supabase.rpc("match_documents", {
			query_embedding: queryEmbedding,
			match_count: k,
		});
		// Handle errors returned by Supabase.
		if (error) {
			throw new Error(`Supabase search failed: ${error.message}`);
		}
		// Return the matching movie records. 
		// If no results are returned, use an empty array instead.
		return data ?? []; 
	} catch (error) {
		// Log the detailed error on the server for debugging.
		console.error("searchMovies failed:", error);
		// Return a simpler error message to the caller.
		throw new Error("Could not search for movies.");
	}
}