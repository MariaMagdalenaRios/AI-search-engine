import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function recommendMovie(query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: query,
  });

  return response.text;
}

async function main() {
  const recommendation = await recommendMovie(
    "Recommend a funny romantic movie and explain why."
  );

  console.log(recommendation);
}

main().catch(console.error);