import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Task =
	| "RETRIEVAL_DOCUMENT"
	| "RETRIEVAL_QUERY"
	| "SEMANTIC_SIMILARITY"
	| "CLASSIFICATION"
	| "CLUSTERING";

export async function embedTexts(
	texts: string[],
	{
		taskType = "RETRIEVAL_DOCUMENT",
		outputDimensionality = 768,
	}: { taskType?: Task; outputDimensionality?: number } = {}
): Promise<number[][]> {
	const res = await ai.models.embedContent({
		model: "gemini-embedding-001",
		contents: texts,
		config: { taskType, outputDimensionality },
	});
	if (!res.embeddings) throw new Error("No embeddings returned");

	return (
		res.embeddings
			?.map((e) => e.values)
			.filter((v): v is number[] => v !== undefined) ?? []
	);
}
