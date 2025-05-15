import { generateEmbedding } from "@/lib/embeddings"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { id, text } = await req.json()

    if (!id || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate embedding
    const embedding = await generateEmbedding(text)

    // Store in database
    const supabase = await createClient()
    const { error } = await supabase.from("embeddings").insert([
      {
        company_data_id: id,
        embedding,
      },
    ])

    if (error) {
      console.error("Error storing embedding:", error)
      return NextResponse.json({ error: "Failed to store embedding" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in generate-embedding API:", error)
    return NextResponse.json({ error: "An error occurred while generating embedding" }, { status: 500 })
  }
}
