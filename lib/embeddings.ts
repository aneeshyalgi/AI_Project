import { createServerClient } from "@/lib/supabase/server"
import { generateEmbedding } from "@/lib/openai"

// Function to generate embeddings for company data
export async function generateEmbeddingForCompanyData(companyDataId: string, content: string): Promise<void> {
  try {
    const supabase = await createServerClient()

    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(content)

    // Store the embedding in the database
    await supabase.from("embeddings").insert({
      company_data_id: companyDataId,
      embedding,
    })
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

// Function to search for relevant company data based on a query
export async function searchCompanyData(query: string, limit = 5): Promise<any[]> {
  try {
    const supabase = await createServerClient()

    // Generate embedding for the query
    const embedding = await generateEmbedding(query)

    // Search for similar embeddings in the database
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error searching company data:", error)
    return []
  }
}

