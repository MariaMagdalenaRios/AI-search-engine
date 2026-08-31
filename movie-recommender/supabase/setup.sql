create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(768) not null
);

alter table documents enable row level security;

drop policy if exists "public read" on documents;
create policy "public read" on documents
  for select using (true);

  create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5
) returns table (
  id bigint,
  content text,
  similarity float
) language sql stable as $$
  select d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  order by d.embedding <=> query_embedding
  limit match_count;
$$;