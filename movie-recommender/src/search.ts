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

export async function searchDocuments(
	embedding: number[],
	matchCount = 5
): Promise<MovieMatch[]> {
	const { data, error } = await supabase.rpc("match_documents", {
		query_embedding: embedding,
		match_count: matchCount,
	});

	if (error) throw new Error(`Supabase search failed: ${error.message}`);

	return data ?? [];
}
