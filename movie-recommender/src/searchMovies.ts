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
		// Kollar så att användaren inte försöker söka med en tom text
		if (!query.trim()) {
			throw new Error("Search query cannot be empty.");
		}

		// Gör om användarens sökning till en embedding med 768 dimensioner
		// så att den kan jämföras med filmernas embeddings i databasen
		const [queryEmbedding] = await embedTexts([query], {
			taskType: "RETRIEVAL_QUERY",
			outputDimensionality: 768,
		});

		// Stoppar sökningen om ingen embedding kunde skapas
		if (!queryEmbedding) {
			throw new Error("Could not generate query embedding.");
		}

		// Skickar vår embedding till Supabase och hämtar de filmer
		// som liknar användarens sökning mest
		const { data, error } = await supabase.rpc("match_documents", {
			query_embedding: queryEmbedding,
			match_count: k,
		});

		// Om Supabase ger ett fel skickas det vidare till catch-blocket
		if (error) {
			throw new Error(`Supabase search failed: ${error.message}`);
		}

		// Returnerar filmerna som hittades eller en tom array om inga hittades
		return data ?? [];
	} catch (error) {
		// Skriver ut det riktiga felet i terminalen så att det blir lättare att felsöka
		console.error("searchMovies failed:", error);

		// Skickar ett enklare felmeddelande vidare till den som anropar funktionen
		throw new Error("Could not search for movies.");
	}
}