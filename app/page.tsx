import { CustomerServiceAvatar } from "@/components/customer-service-avatar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  // In production, we would check for authentication
  // For development, we'll use a mock user ID
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // In production, redirect to login if not authenticated
  // For development, we'll allow access without authentication
  if (!session && process.env.NODE_ENV === "production") {
    redirect("/login")
  }

  const userId = session?.user?.id || "00000000-0000-0000-0000-000000000000"

  return (
    <div className="container flex flex-col items-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[90%]">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Swisscom AI Customer Service</h1>
          <p className="text-muted-foreground">Ask questions about Swisscom products, services, and support</p>
        </div>

        <CustomerServiceAvatar userId={userId} />

        <div className="px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Swisscom AG. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
