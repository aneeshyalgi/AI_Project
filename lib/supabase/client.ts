import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Supabase configuration is missing")
  }

  try {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseKey)
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw new Error("Failed to initialize Supabase client")
  }
}
