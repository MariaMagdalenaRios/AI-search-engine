import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/queryGemini", async (req, res) => {
	try {
		const { prompt } = req.body ?? {};

		if (!process.env.GEMINI_API_KEY) {
			res.status(500).json({ error: "Missing GEMINI_API_KEY" });
			return;
		}

		if (typeof prompt !== "string" || prompt.trim().length === 0) {
			res.status(400).json({ error: "'prompt' must be a non-empty string" });
			return;
		}

		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
		const model = "gemini-2.5-flash-lite";
		const config = {
			thinkingConfig: { thinkingBudget: 0 },
			systemInstruction: [{ text: "Be kind" }],
		};

		const contents = [
			{
				role: "user",
				parts: [{ text: prompt }],
			},
		];

		const response = await ai.models.generateContent({
			model,
			config,
			contents,
		});

		res.json({ text: response.text });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});

//För att implementera detta i frontend behöver ni använda SSE (server-sent events)
//Läs mer här: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
//Och här: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
app.post("/queryGemini/stream", async (req, res) => {
	try {
		const { prompt } = req.body ?? {};

		if (!process.env.GEMINI_API_KEY) {
			res.status(500).json({ error: "Missing GEMINI_API_KEY" });
			return;
		}

		if (typeof prompt !== "string" || prompt.trim().length === 0) {
			res.status(400).json({ error: "'prompt' must be a non-empty string" });
			return;
		}

		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
		const model = "gemini-2.5-flash-lite";
		const config = {
			thinkingConfig: { thinkingBudget: 0 },
			systemInstruction: [{ text: "Be kind" }],
		};

		const contents = [
			{
				role: "user",
				parts: [{ text: prompt }],
			},
		];

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");

		try {
			const response = await ai.models.generateContentStream({
				model,
				config,
				contents,
			});

			for await (const chunk of response) {
				const text = chunk?.text ?? "";
				res.write(`data: ${JSON.stringify({ text })}\n\n`);
			}
			res.end();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			res.write(`event: error\n`);
			res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
			res.end();
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});

app.listen(port, () => {
	console.log(`API listening on http://localhost:${port}`);
});
