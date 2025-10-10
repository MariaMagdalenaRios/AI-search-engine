// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Type } from "@google/genai";

import dotenv from "dotenv";
dotenv.config();

const responseSchema = {
	type: Type.OBJECT,
	required: ["instrument", "family", "confidence"],
	properties: {
		instrument: {
			type: Type.STRING,
		},
		family: {
			type: Type.STRING,
			enum: [
				"brass",
				"woodwind",
				"string",
				"percussion",
				"keyboard",
				"electronic",
			],
		},
		confidence: {
			type: Type.STRING,
			enum: ["high", "medium", "low"],
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
					text: `What family does the tomato belong to?`,
				},
			],
		},
	];

	const response = await ai.models.generateContent({
		model,
		config,
		contents,
	});

	console.log("Classification result:");
	console.log(JSON.parse(response.text ?? ""));
}

main();
