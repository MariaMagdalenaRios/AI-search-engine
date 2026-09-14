import { embedTexts } from "./embed";

//Convert movie request into embedding to be compared to the embeddings stored in Supabase
//using the same 768-dim space as the stored movie vectors
export async function embedQuery(query: string): Promise<number[]> {
	const [embedding] = await embedTexts([query], {
		taskType: "RETRIEVAL_QUERY",
		outputDimensionality: 768,
	});
	
	//Error handling 
	if (!embedding) throw new Error("Gemini returned no embedding for the query");

	return embedding; // 768-dimensional embedding, ready for similarity search
}
