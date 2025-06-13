import { AgentDashboard } from "@/components/admin/agent-dashboard"
// import { SupabaseError } from "@/components/supabase-error"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AgentPage() {
  try {
    const supabase = await createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // In production, redirect to login if not authenticated
    // For development, we'll allow access without authentication
    if (!session && process.env.NODE_ENV === "production") {
      redirect("/login")
    }

    // In production, check if user has agent role
    // For development, we'll allow access without role check
    const userId = session?.user?.id || "00000000-0000-0000-0000-000000000000"

    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage customer handovers and agent availability</p>
        </div>
        <AgentDashboard />
      </div>
    )
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    return <div className="text-red-500">An error occurred while loading the agent dashboard.</div>
  }
}
