import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type TaskType =
	| "RETRIEVAL_DOCUMENT"
	| "RETRIEVAL_QUERY"
	| "SEMANTIC_SIMILARITY";

function parseRetryDelay(err: unknown): number | null {
	try {
		const msg = String(err);
		// API returns retry delay in the error body, e.g. "retryDelay":"23s"
		const match = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
		if (match) return (Number(match[1]) + 2) * 1000; // add 2s buffer
	} catch { /* ignore */ }
	return null;
}

export async function embedTexts(
	texts: string[],
	{
		taskType = "RETRIEVAL_DOCUMENT",
		outputDimensionality = 768,
	}: { taskType?: TaskType; outputDimensionality?: number } = {},
	retries = 3
): Promise<number[][]> {
	try {
		const res = await ai.models.embedContent({
			model: "gemini-embedding-001",
			contents: texts,
			config: { taskType, outputDimensionality },
		});
		if (!res.embeddings) throw new Error("No embeddings returned");
		return res.embeddings
			.map((e) => e.values)
			.filter((v): v is number[] => v !== undefined);
	} catch (err: unknown) {
		const is429 = String(err).includes("429") || String(err).includes("RESOURCE_EXHAUSTED");
		if (is429 && retries > 0) {
			const wait = parseRetryDelay(err) ?? 30_000;
			console.log(`Rate limited — waiting ${Math.round(wait / 1000)}s then retrying...`);
			await new Promise((r) => setTimeout(r, wait));
			return embedTexts(texts, { taskType, outputDimensionality }, retries - 1);
		}
		throw err;
	}
}
