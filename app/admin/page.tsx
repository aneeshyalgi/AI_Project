import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin-dashboard"

export default async function Admin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // Check if user is an admin (this is a simplified check)
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()

  const isAdmin = userData?.role === "admin"

  if (!isAdmin) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Swisscom Admin Dashboard</h1>
          <img src="/swisscom-logo.png?height=40&width=120" alt="Swisscom Logo" className="h-10" />
        </div>
        <AdminDashboard />
      </div>
    </main>
  )
}

