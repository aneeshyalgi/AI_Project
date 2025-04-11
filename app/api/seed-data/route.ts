import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateEmbeddingForCompanyData } from "@/lib/embeddings"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    // Sample Swisscom company data
    const companyData = [
      {
        category: "products",
        title: "Swisscom Mobile Subscriptions",
        content:
          "Swisscom offers a range of mobile subscriptions including inOne mobile, which provides unlimited calls, SMS, and data within Switzerland. Plans vary from basic to premium with different international options and speeds.",
        keywords: ["mobile", "subscription", "inOne", "data", "international"],
      },
      {
        category: "products",
        title: "Swisscom TV",
        content:
          "Swisscom TV is a digital television service offering over 250 channels, replay functionality, and on-demand content. Premium packages include sports and entertainment options.",
        keywords: ["TV", "television", "channels", "replay", "on-demand"],
      },
      {
        category: "services",
        title: "Swisscom Internet",
        content:
          "Swisscom provides high-speed fiber optic internet with speeds up to 10 Gbit/s. All packages include a Swisscom Internet Box for optimal WiFi coverage.",
        keywords: ["internet", "fiber", "wifi", "broadband", "speed"],
      },
      {
        category: "support",
        title: "Technical Support",
        content:
          "Swisscom offers 24/7 technical support via phone at 0800 800 800, live chat on the website, or in-person at Swisscom Shops. Common issues can be resolved using the My Swisscom app.",
        keywords: ["support", "help", "technical", "assistance", "troubleshooting"],
      },
      {
        category: "company",
        title: "About Swisscom",
        content:
          "Swisscom is Switzerland's leading telecommunications provider, founded in 1998 following the partial privatization of PTT. The company employs over 19,000 people and is headquartered in Ittigen, near Bern.",
        keywords: ["about", "company", "history", "headquarters", "employees"],
      },
      {
        category: "billing",
        title: "Billing Information",
        content:
          "Swisscom bills are issued monthly and can be paid via direct debit, e-bill, or bank transfer. Customers can view and download their bills through the My Swisscom app or customer portal.",
        keywords: ["bill", "payment", "invoice", "monthly", "direct debit"],
      },
      {
        category: "products",
        title: "Swisscom Business Solutions",
        content:
          "Swisscom offers comprehensive business solutions including cloud services, IoT, managed network services, and cybersecurity. Custom enterprise solutions are available for large corporations.",
        keywords: ["business", "enterprise", "cloud", "IoT", "security"],
      },
      {
        category: "services",
        title: "Roaming Services",
        content:
          "Swisscom provides roaming coverage in over 200 countries. The Travel options allow for data, calls, and SMS abroad with various packages available depending on destination and duration.",
        keywords: ["roaming", "international", "travel", "abroad", "foreign"],
      },
    ]

    // Insert data and generate embeddings
    for (const item of companyData) {
      // Insert into company_data table
      const { data, error } = await supabase
        .from("company_data")
        .insert({
          category: item.category,
          title: item.title,
          content: item.content,
          keywords: item.keywords,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error inserting company data:", error)
        continue
      }

      // Generate and store embedding
      await generateEmbeddingForCompanyData(data.id, `${item.title} ${item.content}`)
    }

    return NextResponse.json({ success: true, message: "Company data seeded successfully" })
  } catch (error) {
    console.error("Error seeding company data:", error)
    return NextResponse.json({ success: false, error: "Failed to seed company data" }, { status: 500 })
  }
}

