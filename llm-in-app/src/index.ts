// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";

//dotenv
import dotenv from "dotenv";
dotenv.config();

async function main() {
	const ai = new GoogleGenAI({
		apiKey: process.env.GEMINI_API_KEY,
	});
	const config = {
		temperature: 0, //0 = deterministic, 2 = random, 1 = default
		thinkingConfig: {
			thinkingBudget: 0,
		},
		systemInstruction: [
			{
				text: `Be kind`,
			},
		],
	};
	const model = "gemini-2.5-flash-lite";
	const contents = [
		{
			role: "user",
			parts: [
				{
					text: `What is the capital of France?`,
				},
			],
		},
	];

	//Streaaming response
	const response = await ai.models.generateContentStream({
		model,
		config,
		contents,
	});
	for await (const chunk of response) {
		console.log(chunk.text);
	}

	//Non-streaming response
	/* const responseNonStreaming = await ai.models.generateContent({
		model,
		config,
		contents,
	});
	console.log(responseNonStreaming.text); */
}

main();
