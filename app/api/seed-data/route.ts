import { generateEmbedding } from "@/lib/embeddings"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Sample company data
    const companyData = [
      {
        category: "Products",
        title: "Mobile Plans",
        content:
          "Swisscom offers a variety of mobile plans including inOne mobile, which combines mobile, internet, and TV services. Plans start from CHF 65 per month and include unlimited calls, SMS, and data within Switzerland.",
        keywords: ["mobile", "plans", "inOne", "pricing"],
      },
      {
        category: "Products",
        title: "Internet Services",
        content:
          "Swisscom provides high-speed internet services with speeds up to 10 Gbit/s. The standard package includes a Swisscom Box for TV services and a WiFi router.",
        keywords: ["internet", "wifi", "broadband", "fiber"],
      },
      {
        category: "Support",
        title: "Customer Support",
        content:
          "Swisscom customer support is available 24/7 via phone at 0800 800 800, via chat on the Swisscom website, or in person at Swisscom Shops throughout Switzerland.",
        keywords: ["support", "help", "contact", "assistance"],
      },
      {
        category: "Products",
        title: "TV Services",
        content:
          "Swisscom blue TV offers over 300 channels, including 4K content, and features like replay, recording, and streaming apps. It can be accessed via the Swisscom Box or the blue TV app on mobile devices.",
        keywords: ["tv", "television", "streaming", "channels"],
      },
      {
        category: "Support",
        title: "Technical Issues",
        content:
          "For technical issues with Swisscom services, first try restarting your device. If the problem persists, check the Swisscom service status page or contact customer support at 0800 800 800.",
        keywords: ["technical", "issues", "troubleshooting", "problems"],
      },
    ]

    const supabase = await createClient()

    // Insert company data
    for (const data of companyData) {
      const { data: insertedData, error } = await supabase.from("company_data").insert([data]).select()

      if (error) {
        console.error("Error inserting company data:", error)
        continue
      }

      // Generate embedding for the data
      const embedding = await generateEmbedding(`${data.title} ${data.content}`)

      // Insert embedding
      const { error: embeddingError } = await supabase.from("embeddings").insert([
        {
          company_data_id: insertedData[0].id,
          embedding,
        },
      ])

      if (embeddingError) {
        console.error("Error inserting embedding:", embeddingError)
      }
    }

    return NextResponse.json({ success: true, message: "Company data seeded successfully" })
  } catch (error) {
    console.error("Error in seed-data API:", error)
    return NextResponse.json({ error: "An error occurred while seeding data" }, { status: 500 })
  }
}
