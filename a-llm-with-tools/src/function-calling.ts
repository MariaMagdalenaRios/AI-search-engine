// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI, Type } from "@google/genai";

import dotenv from "dotenv";
dotenv.config();

async function main() {
	const ai = new GoogleGenAI({
		apiKey: process.env.GEMINI_API_KEY,
	});
	const tools = [
		{
			functionDeclarations: [
				{
					name: "getWeather",
					description: "gets the weather for a requested city",
					parameters: {
						type: Type.OBJECT,
						properties: {
							city: {
								type: Type.STRING,
							},
						},
					},
				},
			],
		},
	];
	const config = {
		thinkingConfig: {
			thinkingBudget: 0,
		},
		tools,
		systemInstruction: [
			{
				text: `You are a helpful assistant that can get the weather for a requested city. 
                When answering, depending on the weather, suggest activities that are suitable for the weather.`,
			},
		],
	};
	const model = "gemini-flash-latest";
	const contents = [
		{
			role: "user",
			parts: [
				{
					text: `What is the weather like in Berlin?`,
				},
			],
		},
	];

	const response = await ai.models.generateContent({
		model,
		config,
		contents,
	});

	console.log("Kandidater:", response.candidates?.[0].content);
	const part = response.candidates?.[0]?.content?.parts?.[0];
	const functionCall = part?.functionCall;

	console.log("Part is:", part);
	console.log("Function call is:", functionCall);

	if (functionCall && functionCall.name === "getWeather" && functionCall.args) {
		const weatherResult = await getWeather(
			functionCall.args as { city: string }
		);

		//Funktion som sätter igång nästa skeende i applicationen.
		console.log("getWeather result:", weatherResult);
	} else {
		console.log("AI response:", part);
	}
}

main();

async function getWeather(args: { city: string }) {
	return `Weather in ${args.city}: 
    Temperature: 20°C, Humidity: 50%, Wind: 10 km/h
    It's cloudy with a chance of rain.
    `;
}
