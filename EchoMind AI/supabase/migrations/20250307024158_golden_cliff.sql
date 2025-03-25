/*
  # Create embeddings table and functions

  1. New Tables
    - `documents`: Stores text content and their embeddings
      - `id` (uuid, primary key)
      - `content` (text): The actual text content
      - `embedding` (vector): The OpenAI embedding vector
      - `created_at` (timestamp)

  2. Functions
    - `match_documents`: Finds similar documents based on embedding similarity
*/

-- Enable vector extension
create extension if not exists vector;

-- Create documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Create function to match documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;