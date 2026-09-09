import "dotenv/config";
import { embedTexts } from "./embed";
import { supabase } from "./supabase";

type MovieSearchResult = {
	id: number;
	content: string;
	title: string;
	year: number;
	genre: string;
	runtime: number;
	similarity: number;
};

export async function searchMovies(
	query: string,
	k = 3
): Promise<MovieSearchResult[]> {
	try {
		if (!query.trim()) {
			throw new Error("Search query cannot be empty.");
		}

		const [queryEmbedding] = await embedTexts([query], {
			taskType: "RETRIEVAL_QUERY",
			outputDimensionality: 768,
		});

		if (!queryEmbedding) {
			throw new Error("Could not generate query embedding.");
		}

		const { data, error } = await supabase.rpc("match_documents", {
			query_embedding: queryEmbedding,
			match_count: k,
		});

		if (error) {
			throw new Error(`Supabase search failed: ${error.message}`);
		}

		return data ?? [];
	} catch (error) {
		console.error("searchMovies failed:", error);
		throw new Error("Could not search for movies.");
	}
}