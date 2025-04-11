import { createBrowserClient as createClient } from "@supabase/ssr"

// Create a singleton instance to avoid recreating the client on each render
let supabaseClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return supabaseClient
}

