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

app.post("/queryGemini", async (req, res) => {});

app.listen(port, () => {
	console.log(`API listening on http://localhost:${port}`);
});
