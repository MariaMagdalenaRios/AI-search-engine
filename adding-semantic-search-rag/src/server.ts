import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { search } from "./search";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/queryGemini", async (req, res) => {
	//1.Hämta ut relevant data från databasen genom att använda vår Search funktion. <- Retrieve

	const searchResults = await search(req.body.prompt);

	console.log("Sökresultaten är:", searchResults);

	//2.Systeminstruktion som berättar för modellen att den jobbar på chas och har information som vi fått tillbaka från sökningen. <- Augment
	const systemInstruction = `
    Du är en hjälpsam assistent som kan svara på frågor angående en kurs på Chas Academy.
    För att hjälpa dig svara på frågor så har du tillgång till följande dokument:
    ${searchResults.map((result: any) => result.content).join("\n")}
    De kan vara relevanta, men de kan också vara irrelevanta. Du är fri att använda dem eller inte.
    Se till att svara på svenska och alltid göra lite reklam för kursen i dina svar.
    `;

	console.log("System instruction is: ", systemInstruction);

	//3. Generera ett svar baserat på VÅR data. <- Generate
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
			systemInstruction: [{ text: systemInstruction }],
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

app.listen(port, () => {
	console.log(`API listening on http://localhost:${port}`);
});
