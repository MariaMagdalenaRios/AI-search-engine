import "dotenv/config";
import { embedTexts } from "./embed";
import { supabase } from "./supabase";

export async function search(query: string, k = 3) {
	// Använd retrieval query här
	const [qVec] = await embedTexts([query], {
		taskType: "RETRIEVAL_QUERY",
		outputDimensionality: 768,
	});

	// Anropa vår rpc för att hämta mest semantiskt lika dokument
	const { data, error } = await supabase.rpc("match_documents", {
		query_embedding: qVec,
		match_count: k,
	});

	if (error) throw error;
	console.table(
		data?.map((r: any) => ({
			id: r.id,
			similarity: Number(r.similarity.toFixed(4)),
			content: r.content,
		}))
	);

	return data;
}
