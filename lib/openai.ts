import OpenAI from "openai"

// Initialize the OpenAI client with your API key
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// Function to generate embeddings (not used in development mode)
export async function generateEmbedding(text: string): Promise<number[]> {
  // In development mode, return a mock embedding
  if (process.env.NODE_ENV === "development") {
    return Array(1536)
      .fill(0)
      .map(() => Math.random())
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })

  return response.data[0].embedding
}

