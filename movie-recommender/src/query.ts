import { embedTexts } from "./embed";

export async function embedQuery(query: string): Promise<number[]> {
	const [embedding] = await embedTexts([query], {
		taskType: "RETRIEVAL_QUERY",
		outputDimensionality: 768,
	});

	if (!embedding) throw new Error("Gemini returned no embedding for the query");

	return embedding;
}
