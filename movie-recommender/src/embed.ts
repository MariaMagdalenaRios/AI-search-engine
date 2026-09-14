import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// Create the Gemini AI client using the API key stored in the .env file. 
// The API key is kept outside the source code for security reasons.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// These task types tell Gemini what the embeddings will be used for.
// RETRIEVAL_DOCUMENT is used when creating embeddings for movies. 
// RETRIEVAL_QUERY is used when creating an embedding for a user's search. 
// SEMANTIC_SIMILARITY can be used when comparing the meaning of texts.
export type TaskType =
	| "RETRIEVAL_DOCUMENT"
	| "RETRIEVAL_QUERY"
	| "SEMANTIC_SIMILARITY";

/** 
 * Reads the retry delay from a Gemini API error. *
 * 
 * When the API is rate limited, it can return a recommended wait time, 
 * for example "retryDelay":"23s". This function extracts that value 
 * so that the application can wait before trying again. 
 */

function parseRetryDelay(err: unknown): number | null {
	try {
		const msg = String(err);
		// Look for a retry delay in the API error message.
		const match = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
		if (match) return (Number(match[1]) + 2) * 1000; // add 2s buffer
		// Add a 2-second buffer to make the retry more reliable.
	} catch { /* ignore */ }
	return null;
}

/** 
* Converts text into embeddings using Gemini. 
* 
* An embedding is a numerical representation of the meaning of text. 
* Our application uses these vectors to perform semantic search. 
* 
* The function can create embeddings for multiple texts at once. 
* The default output is 768 dimensions, which matches the vector 
* dimension used in our Supabase database. 
* 
* @param texts - Texts that should be converted into embeddings. 
* @param taskType - Describes how the embeddings will be used. 
* @param outputDimensionality - Number of values in each embedding vector. 
* @param retries - Number of times to retry after rate limiting. 
*/
export async function embedTexts(
	texts: string[],
	{
		taskType = "RETRIEVAL_DOCUMENT",
		outputDimensionality = 768,
	}: { taskType?: TaskType; outputDimensionality?: number } = {},
	retries = 3
): Promise<number[][]> {
	try {
		// Send the text to Gemini's embedding model.
		const res = await ai.models.embedContent({
			model: "gemini-embedding-001",
			contents: texts,
			config: { taskType, outputDimensionality },
		});
		// Make sure Gemini actually returned embeddings.
		if (!res.embeddings) throw new Error("No embeddings returned");
		// Extract the numerical vectors from the API response. 
		// Only return values that are defined.
		return res.embeddings
			.map((e) => e.values)
			.filter((v): v is number[] => v !== undefined);
	} catch (err: unknown) {
		// Gemini can temporarily reject requests when too many requests 
		// are made. This is especially relevant when seeding many movies.
		const is429 = String(err).includes("429") || String(err).includes("RESOURCE_EXHAUSTED");
		if (is429 && retries > 0) {
			// Use Gemini's recommended delay when available. 
			// Otherwise, wait 30 seconds before retrying.
			const wait = parseRetryDelay(err) ?? 30_000;
			console.log(`Rate limited — waiting ${Math.round(wait / 1000)}s then retrying...`);
			// Wait before making the API request again.
			await new Promise((r) => setTimeout(r, wait));
			// Try again with one fewer retry available.
			return embedTexts(texts, { taskType, outputDimensionality }, retries - 1);
		}
		// If the error is not a rate-limit error or all retries are used, 
		// pass the error to the caller.
		throw err;
	}
}
