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

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with pgvector enabled
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
- The `documents` table (stores movie text + embeddings)
- Row Level Security (public can read, only the server can write)
- The `match_documents` function (cosine similarity search)

### 4. Seed the database

Embed all 105 movies and insert them into Supabase:

```bash
npm run seed
```

This reads `data/movies.json`, calls Gemini to generate a vector for each movie, and inserts the rows. Takes about 1–2 minutes. Safe to re-run — it clears existing rows first.

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
│   └── movies.json          # 105 movies with title, year, genre, runtime, overview
├── src/
│   ├── seed.ts              # one-time script: embed movies and insert into Supabase
│   └── ...                  # app code (Next.js pages / API routes)
├── supabase/
│   └── setup.sql            # database schema — run once in Supabase SQL Editor
├── .env                     # your keys (gitignored)
├── .env.example             # template for teammates
└── README.md
```

---

## Shared team setup

The team uses **one shared Supabase project**. Only one person needs to run the SQL setup and the seed script. Everyone else just needs the same `.env` values.

If you are a teammate joining the project:
1. Get the `.env` values from the person who set up Supabase
2. Run `npm install`
3. Run `npm run dev` — no seeding needed, the data is already in the shared database

---

## Notes

- Movies are embedded using `genre + overview` text so mood words like *"heartbreaking"* or *"hilarious"* carry weight in the search
- `runtime` is stored as a column so you can filter by length (e.g. under 120 minutes)
- The `SUPABASE_SECRET_KEY` is used only server-side for writing. Never expose it to the browser
