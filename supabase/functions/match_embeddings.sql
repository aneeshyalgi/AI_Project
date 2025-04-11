-- Create a stored procedure for matching embeddings
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  company_data_id uuid,
  title text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cd.id,
    e.company_data_id,
    cd.title,
    cd.content,
    cd.category,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM
    embeddings e
  JOIN
    company_data cd ON e.company_data_id = cd.id
  WHERE
    1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;

