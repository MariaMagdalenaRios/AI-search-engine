import express from "express";
import cors from "cors";
import { embedQuery } from "./query";
import { searchDocuments } from "./search";
// Create the Express application.
const app = express();
// Allow requests from the frontend. 
// This is needed because the frontend and API server run on 
// different local ports during development.
app.use(cors());
// Allow the server to read JSON data from incoming requests.
app.use(express.json());
/** 
* Search endpoint used by the frontend. 
* 
* The frontend sends a natural-language movie query to this endpoint. 
* The query is then converted into an embedding and searched against 
* the movie embeddings stored in Supabase. 
*
* Flow: * Frontend → API → Embedding → Semantic Search → Movies → Frontend 
*/
app.post("/api/search", async (req, res) => {
	// Get the user's search query from the request body.
	const query = req.body?.query;
	// Validate that the query exists and is a non-empty string. 
	// Returning a 400 error prevents invalid requests from being 
	// sent to the embedding API.
	if (typeof query !== "string" || !query.trim()) {
		res.status(400).json({ error: "Missing 'query' string in request body" });
		return;
	}

	try {
		// Convert the user's natural-language query into an embedding. 
		// The embedding represents the meaning of the query as numbers.
		const embedding = await embedQuery(query);
		// Use the query embedding to perform semantic search. 
		// The search returns the five most similar movies from the database.
		const movies = await searchDocuments(embedding, 5);
		// Send the matching movies back to the frontend as JSON.
		res.json(movies);
	} catch (err) {
		// Log the technical error on the server so it can be debugged.
		console.error(err);
		// Return a general error message to the client instead of 
		// exposing internal error details.
		res.status(500).json({ error: "Search failed" });
	}
});
// Port used by the Express API server.
const PORT = 3001;
// Start the API server and confirm that it is running.
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
