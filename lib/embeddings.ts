import openai from "./openai"
import { createClient } from "./supabase/server"

// Function to generate embeddings for a text
export async function generateEmbedding(text: string) {
  // In development mode, return a random vector to avoid unnecessary API calls
  if (process.env.NODE_ENV === "development") {
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

// Function to search for relevant company data
export async function searchCompanyData(query: string, threshold = 0.7, limit = 5) {
  // In development mode, return mock data
  if (process.env.NODE_ENV === "development") {
    return getMockCompanyData()
  }

  try {
    const embedding = await generateEmbedding(query)
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error("Error searching company data:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error in searchCompanyData:", error)
    return []
  }
}

// Mock company data for development
function getMockCompanyData() {
  return [
    {
      id: "1",
      title: "Mobile Plans",
      content:
        "Swisscom offers a variety of mobile plans including inOne mobile, which combines mobile, internet, and TV services. Plans start from CHF 65 per month and include unlimited calls, SMS, and data within Switzerland.",
      category: "Products",
      similarity: 0.92,
    },
    {
      id: "2",
      title: "Internet Services",
      content:
        "Swisscom provides high-speed internet services with speeds up to 10 Gbit/s. The standard package includes a Swisscom Box for TV services and a WiFi router.",
      category: "Products",
      similarity: 0.85,
    },
    {
      id: "3",
      title: "Customer Support",
      content:
        "Swisscom customer support is available 24/7 via phone at 0800 800 800, via chat on the Swisscom website, or in person at Swisscom Shops throughout Switzerland.",
      category: "Support",
      similarity: 0.78,
    },
  ]
}
