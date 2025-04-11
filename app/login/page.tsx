import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import LoginForm from "@/components/login-form"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Login() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already logged in, redirect to home page
  if (user) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/swisscom-logo.png?height=60&width=180" alt="Swisscom Logo" className="h-16 mb-4" />
          <h1 className="text-3xl font-bold text-blue-600">Swisscom AI Assistant</h1>
          <p className="text-gray-600 mt-2">Sign in to chat with our AI customer service</p>
        </div>
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

