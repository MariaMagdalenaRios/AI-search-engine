import { supabase } from "./supabase";

export type MovieMatch = {
	id: number;
	content: string;
	title: string | null;
	year: number | null;
	genre: string | null;
	runtime: number | null;
	similarity: number;
};

// Search the Supabase documents table, using the query embedding.
export async function searchDocuments(
	embedding: number[],
	matchCount = 5 // caps results to the requested amount, e.g. top 5
): Promise<MovieMatch[]> {
	// Calls Supabase's match_documents() RPC, passing the query embedding.
	const { data, error } = await supabase.rpc("match_documents", {
		query_embedding: embedding,
		match_count: matchCount,
	});

	// Handles Supabase errors instead of letting a bad response fall through.
	if (error) throw new Error(`Supabase search failed: ${error.message}`);

	return data ?? []; // matched movie records
}
