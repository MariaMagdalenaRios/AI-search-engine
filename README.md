# Movie Recommender

An AI-powered movie recommendation web application that uses semantic search and generative AI to recommend movies based on natural-language descriptions.

Instead of searching only by title or genre, users can describe what they feel like watching — for example:

“Something funny, emotional and romantic, but not too long.”

The application converts the user's request into an embedding, searches a movie database using semantic similarity, and then uses Gemini to generate a natural-language recommendation based on the retrieved movies.

## Features
- Natural-language movie search
- Semantic similarity search using embeddings
- 105 movies stored in Supabase
- pgvector for vector similarity search
- Gemini embeddings for movie and query representations
- Gemini LLM for generating the final recommendation
- Recommendation is restricted to movies retrieved from the database
- Simple React + Vite frontend
- Express API server
- Search testing from the command line

## Technology Stack
- React — frontend UI
- Vite — frontend development and build tool
- Express — API server
- Supabase — database and backend services
- pgvector — vector storage and similarity search
- Google Gemini — embeddings and recommendation generation
- TypeScript — application code
- tsx — running TypeScript scripts directly

## How It Works

The application uses a retrieval-augmented approach:

User's natural-language request
          ↓
Gemini generates a query embedding
          ↓
Supabase / pgvector performs similarity search
          ↓
Top matching movies are retrieved
          ↓
Retrieved movie information is sent to Gemini
          ↓
Gemini selects ONE movie from the retrieved results
          ↓
Natural-language recommendation and explanation

1. Movie embeddings

Each movie is converted into an embedding using Gemini.

The embedding is generated from information such as the movie's genre and overview.

The embeddings use:

Model: gemini-embedding-001
Task type: RETRIEVAL_DOCUMENT
Dimensions: 768

These vectors are stored in the Supabase documents table.

2. Semantic search

When a user enters a request, the query is converted into a query embedding using:

Task type: RETRIEVAL_QUERY
Dimensions: 768

Supabase then uses pgvector and cosine similarity to find the most semantically similar movies.

The search is performed through the match_documents database function.

3. AI recommendation

The top retrieved movies are passed to Gemini together with the user's original request.

The LLM is instructed to:

- recommend only one movie
- choose only from the retrieved movies
- not invent a movie outside the retrieved results
- explain why the selected movie matches the request

This combines semantic retrieval with generative AI.

## Prerequisites

Before running the project, install:

- Node.js 20+
- A Supabase project
- pgvector enabled in Supabase
- A Google Gemini API key

## Setup

1. Clone the repository
git clone <repo-url>
cd movie-recommender
2. Install dependencies
npm install
3. Configure environment variables

Copy the example environment file:

cp .env.example .env

Add your own credentials to .env:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
GEMINI_API_KEY=your_gemini_api_key

Never commit .env or expose secret keys in frontend code.

Where to find the keys

Supabase

Go to your Supabase project and open:

Settings → API Keys

Gemini

Create an API key through Google AI Studio.

## Database Setup

Open the SQL Editor in your Supabase project.

Run the SQL from:

supabase/setup.sql

This creates the database structure required by the application, including:

- documents table
- movie metadata
- 768-dimensional vector embeddings
- Row Level Security
- match_documents function for similarity search

The database uses pgvector for vector similarity search.

## Seed the Database

The project contains 105 movies in:

data/movies.json

Run:

npm run seed

The seed script:

Reads the movie data.
Creates embeddings using Gemini.
Stores the movie information and embeddings in Supabase.

The seed operation can take a little while because it makes embedding requests to Gemini.

The database only needs to be seeded once for each developer's Supabase project.

## Run the Application

The current application uses React + Vite with a separate Express API server.

You need two terminal windows.

Terminal 1 — Start the API server
npm run dev:api
Terminal 2 — Start the frontend
npm run dev:web

Vite will display the local frontend address in the terminal, normally:

http://localhost:5173

Open that address in your browser.

## Available Scripts

Command	Description
npm install	Install project dependencies
npm run seed	Generate embeddings and seed the movie database
npm run test:search	Test semantic search from the command line
npm run dev:api	Start the Express API server
npm run dev:web	Start the Vite development server

## Testing Semantic Search

The search test accepts a natural-language query from the command line.

For example:

npm run test:search -- "A dark and suspenseful thriller with danger and unexpected twists"

Example results:

- Prisoners (2013)
- Gone Girl (2014)
- Se7en (1995)
- Nightcrawler (2014)
- Zodiac (2007)

Another example:

npm run test:search -- "An uplifting and feel-good story about hope and overcoming difficulties"

Example results include:

- The Intouchables (2011)
- The Shawshank Redemption (1994)
- Good Will Hunting (1997)
- Paddington 2 (2017)
- Sing Street (2016)

These tests demonstrate that the search can identify movies based on meaning, mood and themes rather than requiring exact keywords.

## AI Reflection
1. Which new AI technology or library did we identify and how did we apply it?

We used Google's Gemini API for two different AI tasks.

First, we used Gemini's embedding model, gemini-embedding-001, to convert movie descriptions and user queries into numerical vectors.

Second, we used a Gemini language model to generate the final movie recommendation and explanation.

The embeddings are stored in Supabase using pgvector, allowing the application to perform semantic similarity searches.

2. Why did we choose this technology?

We chose Gemini because it provides both embedding and generative AI capabilities through an API that integrates well with our TypeScript application.

Using embeddings allowed us to implement semantic search without having to manually define a large number of keywords or rules for different movie moods, themes and descriptions.

Supabase was also a good fit because pgvector allows us to store and search embeddings directly in the database.

3. Why was AI needed? Could it be solved another way?

A traditional keyword search could find movies containing words such as "romantic", "thriller", or "space".

However, users often describe what they want to watch using concepts and feelings rather than exact movie metadata.

For example:

"I want something uplifting about overcoming difficult situations."

A keyword-based system would need many manually created rules and synonyms to handle this effectively.

Semantic embeddings allow the system to compare the meaning of the user's request with the meaning of movie descriptions.

The LLM then adds another layer by interpreting the retrieved results and explaining why one movie is a good recommendation.

This could also have been solved without AI. A simpler application could use:

- keyword matching
- genre filters
- manually defined categories
- a traditional search engine
- manually written recommendation rules

These approaches would be easier to implement and more predictable, but they would not handle natural-language descriptions as flexibly.

AI is therefore useful for this application because understanding the user's intent and semantic meaning is an important part of the problem.

## Limitations and What We Learned

Our testing showed that semantic search can work very well, but it does not guarantee that every retrieved result satisfies every detail of a query.

For example, when we tested:

"A dark and suspenseful thriller with danger and unexpected twists"

the top results were:

- Prisoners
- Gone Girl
- Se7en
- Nightcrawler
- Zodiac

These were strong semantic matches and showed that the system handled the thriller query well.

However, when we tested:

"An exciting space adventure with astronauts exploring the universe"

the results included:

- Toy Story
- Dune
- Interstellar
- Top Gun: Maverick
- WALL-E

Some results were relevant, such as Interstellar and Dune, but Toy Story and Top Gun: Maverick were weaker matches.

This showed us an important limitation of embeddings: semantic similarity is not the same as strict filtering.

An embedding can identify that two pieces of text are conceptually related without guaranteeing that specific constraints, such as "astronauts", are satisfied.

This is one reason we combine semantic retrieval with an LLM. The retrieval stage finds a relevant candidate set, while the LLM interprets the user's request and selects a recommendation from those candidates.

The project also showed that AI services can occasionally fail because of temporary API availability or high demand. We added retry handling around the Gemini recommendation request to make the application more resilient.

## Project Structure

movie-recommender/
├── data/
│   └── movies.json              # Movie dataset
│
├── src/
│   ├── App.tsx                  # React frontend
│   ├── main.tsx                 # React entry point
│   ├── api-server.ts            # Express API server
│   ├── query.ts
│   ├── search.ts 
│   ├── searchMovies.ts          # Semantic movie search
│   ├── recommend.ts             # Gemini recommendation logic
│   ├── embed.ts                 # Gemini embedding helper
│   ├── seed.ts                  # Database seeding
│   ├── test-search.ts           # Command-line search testing
│   └── supabase.ts              # Supabase client
│
├── supabase/
│   └── setup.sql                # Database schema and RPC function
│
├── .env.example                 # Environment variable template
├── .gitignore
├── index.html                   # Vite HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

## Team Setup

Each team member uses their own Supabase project and database.

After cloning the repository, each team member should:

Create a Supabase project.
Enable pgvector if necessary.
Run supabase/setup.sql in the Supabase SQL Editor.
Create their own .env file using .env.example.
Run the seed script to populate their own database.
npm install
npm run seed

The seed script creates embeddings for the 105 movies and stores them in the team member's own Supabase database.

To run the application:

Terminal 1 — API server:

npm run dev:api

Terminal 2 — frontend:

npm run dev:web

This setup means that team members do not need access to a shared database, and each developer can independently run and test the complete application.

The main AI pipeline is:

Natural language
      ↓
Gemini embeddings
      ↓
Supabase + pgvector
      ↓
Semantic retrieval
      ↓
Gemini LLM
      ↓
Movie recommendation

The project also demonstrates an important practical limitation of AI-based search: retrieved results can be semantically related without perfectly satisfying every constraint in the user's request.

This made the project useful not only for demonstrating AI techniques, but also for understanding when AI works well, where it can fail, and why combining different techniques can produce better results.