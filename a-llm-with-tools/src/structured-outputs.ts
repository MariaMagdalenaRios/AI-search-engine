// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Type } from "@google/genai";

import dotenv from "dotenv";
dotenv.config();

const responseSchema = {
	type: Type.OBJECT,
	required: ["title", "preamble", "metadata"],
	properties: {
		title: {
			type: Type.STRING,
		},
		preamble: {
			type: Type.STRING,
		},
		author: {
			description: "only add author if mentioned in the users prompt",
			type: Type.STRING,
			enum: ["Joel Janson Johansen", "Hampus Lubran", "Nehal Fouad"],
		},
		metadata: {
			type: Type.OBJECT,
			required: ["date", "category", "tags"],
			properties: {
				date: {
					type: Type.STRING,
				},
				category: {
					type: Type.STRING,
				},
				tags: {
					type: Type.ARRAY,
					items: {
						type: Type.STRING,
					},
				},
			},
		},
	},
};

async function main() {
	const ai = new GoogleGenAI({
		apiKey: process.env.GEMINI_API_KEY,
	});
	const config = {
		thinkingConfig: {
			thinkingBudget: 0,
		},
		responseMimeType: "application/json",
		responseSchema,
	};
	const model = "gemini-flash-latest";
	const contents = [
		{
			role: "user",
			parts: [
				{
					text: `Could you write an article about how the AI-course on Chas Academy should be longer with todays date (2025-10-10)?`,
				},
			],
		},
	];

	const response = await ai.models.generateContent({
		model,
		config,
		contents,
	});

	const parsedResponse = JSON.parse(response.text ?? "");

	console.log("Structured output:", parsedResponse);
	console.log("Title:", parsedResponse.title);
	console.log("Preamble:", parsedResponse.preamble);
	console.log("Author:", parsedResponse.author);
	console.log("Metadata:", parsedResponse.metadata);
}

main();
