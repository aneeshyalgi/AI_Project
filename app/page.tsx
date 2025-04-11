import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import CustomerServiceAvatar from "@/components/customer-service-avatar"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Home() {
  const supabase = await createServerClient()

  // Use getUser() instead of getSession() for better security
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If user is not logged in, redirect to login page
  if (!user || error) {
    // For development, you can comment out the redirect and use a mock user ID
    const isDevelopment = process.env.NODE_ENV === "development"
    if (isDevelopment) {
      // Use a mock user ID for development
      const mockUserId = "00000000-0000-0000-0000-000000000000"
      return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white">
          <div className="z-10 w-full max-w-5xl items-center justify-between">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-blue-600">Swisscom AI Assistant</h1>
              <img src="/swisscom-logo.png?height=40&width=120" alt="Swisscom Logo" className="h-10" />
            </div>

            <Suspense fallback={<AvatarSkeleton />}>
              <CustomerServiceAvatar userId={mockUserId} />
            </Suspense>
          </div>
        </main>
      )
    }

    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-blue-600">Swisscom AI Assistant</h1>
          <img src="/swisscom-logo.png?height=40&width=120" alt="Swisscom Logo" className="h-10" />
        </div>

        <Suspense fallback={<AvatarSkeleton />}>
          <CustomerServiceAvatar userId={user.id} />
        </Suspense>
      </div>
    </main>
  )
}

function AvatarSkeleton() {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-6">
      <div className="w-full flex justify-end">
        <Skeleton className="h-10 w-24" />
      </div>

      <Skeleton className="w-full h-[400px] rounded-lg" />

      <div className="w-full">
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  )
}

