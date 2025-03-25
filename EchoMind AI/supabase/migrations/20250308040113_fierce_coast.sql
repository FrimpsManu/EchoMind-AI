/*
  # Create vector similarity search function

  1. New Functions
    - `match_messages`: Finds similar messages using cosine similarity
      - Parameters:
        - query_embedding: vector to match against
        - match_threshold: minimum similarity threshold
        - match_count: maximum number of results to return

  2. Description
    - Uses cosine similarity to find messages with similar meaning
    - Returns messages above the similarity threshold
    - Orders results by similarity score
*/

CREATE OR REPLACE FUNCTION match_messages(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    messages.id,
    messages.content,
    1 - (messages.embedding <=> query_embedding) as similarity
  FROM messages
  WHERE 1 - (messages.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;