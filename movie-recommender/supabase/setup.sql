-- Run this in Supabase → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS and CREATE OR REPLACE throughout

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create the documents table with all movie fields
create table if not exists documents (
  id       bigserial primary key,
  content  text    not null,   -- the text that was embedded (genre + overview)
  title    text,
  year     int,
  genre    text,
  runtime  int,
  embedding vector(768) not null
);

-- 3. If the table already exists without the new columns, add them
alter table documents add column if not exists title   text;
alter table documents add column if not exists year    int;
alter table documents add column if not exists genre   text;
alter table documents add column if not exists runtime int;

-- 4. Row Level Security: block all writes from public, allow reads
alter table documents enable row level security;

drop policy if exists "public read" on documents;
create policy "public read" on documents
  for select using (true);

-- 5. Similarity search function
-- Drop first so we can change the return type safely
drop function if exists match_documents(vector(768), int);

create or replace function match_documents(
  query_embedding vector(768),
  match_count     int default 5
) returns table (
  id         bigint,
  content    text,
  title      text,
  year       int,
  genre      text,
  runtime    int,
  similarity float
) language sql stable as $$
  select
    d.id,
    d.content,
    d.title,
    d.year,
    d.genre,
    d.runtime,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
