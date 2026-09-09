import express from "express";
import cors from "cors";
import { embedQuery } from "./query";
import { searchDocuments } from "./search";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/search", async (req, res) => {
	const query = req.body?.query;
	if (typeof query !== "string" || !query.trim()) {
		res.status(400).json({ error: "Missing 'query' string in request body" });
		return;
	}

	try {
		const embedding = await embedQuery(query);
		const movies = await searchDocuments(embedding, 5);
		res.json(movies);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Search failed" });
	}
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
