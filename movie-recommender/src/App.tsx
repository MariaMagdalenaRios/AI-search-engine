import { useState } from "react";
import type { FormEvent } from "react";
import type { MovieMatch } from "./search";

export default function App() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<MovieMatch[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSearch(e: FormEvent) {
		e.preventDefault();
		if (!query.trim()) return;

		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query }),
			});
			if (!res.ok) throw new Error(`Search failed (${res.status})`);
			setResults(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
			<h1>Movie Recommender</h1>
			<form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="e.g. a funny romantic movie about relationships"
					style={{ flex: 1, padding: 8 }}
				/>
				<button type="submit" disabled={loading}>
					{loading ? "Searching..." : "Search"}
				</button>
			</form>

			{error && <p style={{ color: "red" }}>{error}</p>}

			<ul style={{ listStyle: "none", padding: 0 }}>
				{results.map((movie) => (
					<li key={movie.id} style={{ padding: "12px 0", borderBottom: "1px solid #ddd" }}>
						<strong>{movie.title}</strong> ({movie.year}) — {movie.genre}
						<div>Similarity: {movie.similarity.toFixed(3)}</div>
					</li>
				))}
			</ul>
		</main>
	);
}
