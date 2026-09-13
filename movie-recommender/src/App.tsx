import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { MovieMatch } from "./search";
import "./App.css";

const THEME_KEY = "movie-recommender-theme";

// `content` was embedded as "{title}. {genre}. {plot}" — strip that prefix
// back off so the card can show just the plot.
function getPlot(movie: MovieMatch): string {
	const prefix = `${movie.title}. ${movie.genre}. `;
	return movie.content.startsWith(prefix) ? movie.content.slice(prefix.length) : movie.content;
}

export default function App() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<MovieMatch[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [expanded, setExpanded] = useState<Set<number>>(new Set());
	const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === "dark");

	useEffect(() => {
		document.documentElement.dataset.theme = darkMode ? "dark" : "light";
		localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
	}, [darkMode]);

	function togglePlot(id: number) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

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
			setHasSearched(true);
		}
	}

	const statusMessage = loading
		? "Searching for movies…"
		: hasSearched && !error
			? `${results.length} movie${results.length === 1 ? "" : "s"} found`
			: "";

	return (
		<main className="page">
			<div className="container">
				<header className="hero">
					<button
						type="button"
						className="theme-toggle"
						onClick={() => setDarkMode((prev) => !prev)}
						aria-pressed={darkMode}
						aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
						title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
					>
						{darkMode ? (
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
								<circle cx="12" cy="12" r="4" />
								<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
							</svg>
						) : (
							<svg viewBox="0 0 24 24" fill="currentColor">
								<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
							</svg>
						)}
					</button>
					<span className="eyebrow">AI-Powered Semantic Search</span>
					<h1>Find your next movie</h1>
					<p>Describe a vibe, a plot, or a feeling — the search understands meaning, not just keywords.</p>
				</header>

				<form onSubmit={handleSearch} className="search-form" role="search" aria-label="Movie search">
					<label htmlFor="movie-search" className="sr-only">
						Describe the movie you're looking for
					</label>
					<input
						id="movie-search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="e.g. a funny romantic movie about relationships"
					/>
					<button type="submit" disabled={loading}>
						{loading && <span className="spinner" aria-hidden="true" />}
						{loading ? "Searching" : "Search"}
					</button>
				</form>

				<p role="status" className="sr-only">
					{statusMessage}
				</p>

				{error && (
					<div className="error-banner" role="alert">
						<span aria-hidden="true">⚠</span> {error}
					</div>
				)}

				{!error && hasSearched && !loading && results.length === 0 && (
					<div className="empty-state">No movies matched that description. Try rephrasing your search.</div>
				)}

				<ul className="results-grid">
					{results.map((movie) => {
						const plot = getPlot(movie);
						const isExpanded = expanded.has(movie.id);
						const plotId = `plot-${movie.id}`;
						return (
							<li key={movie.id} className="movie-card">
								<div className="movie-card-header">
									<h2 className="movie-title">{movie.title}</h2>
									<span className="movie-year">{movie.year}</span>
								</div>
								{movie.genre && <span className="movie-genre">{movie.genre}</span>}
								{plot && (
									<div>
										<p id={plotId} className={`movie-plot${isExpanded ? "" : " movie-plot--clamped"}`}>
											{plot}
										</p>
										<button
											type="button"
											className="plot-toggle"
											aria-expanded={isExpanded}
											aria-controls={plotId}
											onClick={() => togglePlot(movie.id)}
										>
											{isExpanded ? "Show less" : "Read plot"}
										</button>
									</div>
								)}
								<div className="similarity">
									<div className="similarity-label">
										<span>Match</span>
										<span>{Math.round(movie.similarity * 100)}%</span>
									</div>
									<div className="similarity-track" aria-hidden="true">
										<div
											className="similarity-fill"
											style={{ width: `${Math.min(100, Math.max(0, movie.similarity * 100))}%` }}
										/>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</main>
	);
}
