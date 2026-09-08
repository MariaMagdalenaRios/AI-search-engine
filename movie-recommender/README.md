# Movie Recommender

AI-powered movie recommendations using semantic search.

The user describes what they feel like watching in natural language — for example *"something funny, emotional and romantic, but not too long"* — and the app finds movies that match the mood.

**Stack:** Next.js · Supabase (pgvector) · Gemini embeddings

---

## How it works

```
User query
  → embed with Gemini (RETRIEVAL_QUERY, 768d)
  → cosine similarity search in Supabase (match_documents RPC)
  → top matching movies
  → Gemini generates a personalised recommendation explanation
```

Embeddings are vectors — arrays of numbers that represent the *meaning* of a piece of text. Two texts with similar meaning will produce similar vectors. The `match_documents` function in Supabase finds whichever stored movie vectors are closest to the query vector, using cosine similarity.

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (pgvector is enabled by default)
- A [Gemini API key](https://aistudio.google.com)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd movie-recommender
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Open `.env` and add your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
GEMINI_API_KEY=...
```

Where to find them:
- **Supabase keys:** your project → Settings → API Keys
- **Gemini key:** [aistudio.google.com](https://aistudio.google.com) → Get API key

### 3. Set up the database

Go to your Supabase project → **SQL Editor**, paste the contents of `supabase/setup.sql` and click **Run**.

This creates:
- The `documents` table (id, content, title, year, genre, runtime, embedding)
- Row Level Security — public can read, only the server secret key can write
- The `match_documents` function — takes a query vector, returns the closest movies

You only need to do this once per Supabase project.

### 4. Seed the database

This step loads all 105 movies into Supabase with their embeddings.

**First time — generate and save embeddings (takes 5–7 min):**

```bash
npm run seed:generate
```

This calls the Gemini API to embed each movie, saves the vectors to
`data/movies-with-embeddings.json`, then inserts everything into Supabase.
The cache file is saved locally so you never need to call the API again.

**Every time after — use the cache (takes ~5 seconds):**

```bash
npm run seed
```

Reads the local cache and inserts into Supabase. No API calls, no waiting.
Safe to re-run — it clears existing rows before inserting.

> **Note on rate limits:** The Gemini free tier allows ~100 texts per minute.
> The seed script handles this automatically — if it hits the limit it waits
> and retries. Just leave it running.

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
movie-recommender/
├── data/
│   ├── movies.json                    # 105 movies: title, year, genre, runtime, overview
│   └── movies-with-embeddings.json    # generated cache — gitignored, stays local
├── src/
│   ├── embed.ts                       # calls Gemini to turn text into vectors
│   ├── seed.ts                        # loads movies, embeds, inserts into Supabase
│   └── ...                            # app code (Next.js pages / API routes)
├── supabase/
│   └── setup.sql                      # database schema — run once in SQL Editor
├── .env                               # your keys (gitignored)
├── .env.example                       # template for teammates
└── README.md
```

---

## Shared team setup

The team uses **one shared Supabase project**. Only one person needs to run the SQL setup and `seed:generate`. Everyone else just needs the same `.env` values.

**If you are a teammate joining the project:**

1. Get the `.env` values from the person who set up Supabase
2. Run `npm install`
3. Run `npm run seed` — reads the local cache and seeds the shared database in seconds
4. Run `npm run dev`

> If you do not have `data/movies-with-embeddings.json` yet, ask a teammate for it
> or run `npm run seed:generate` yourself (needs a Gemini API key and ~7 min).

---

## Notes

- **Why `genre + overview` for embeddings?** The mood lives in the overview — words like *"heartbreaking"*, *"hilarious"*, *"slow-burn"*. Genre adds a coarse signal. Year and runtime are stored as columns for filtering but not embedded.
- **`runtime` as a column** means you can later filter by length, e.g. `where runtime < 120`.
- **`SUPABASE_SECRET_KEY`** bypasses Row Level Security and must only ever be used server-side (in API routes or scripts). Never send it to the browser.
- **`NEXT_PUBLIC_` prefix** is a Next.js convention — those variables are bundled into the browser bundle. Safe for the publishable key, not for the secret key.
