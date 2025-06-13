"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect, useState } from "react"

export function SiteHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: any } | null) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-swisscom-blue text-white font-bold px-2 py-1 rounded">Swisscom</div>
            <span className="hidden font-bold sm:inline-block">AI Assistant</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-foreground/60"
              }`}
            >
              Home
            </Link>
            <Link
              href="/admin"
              className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/admin" ? "text-primary" : "text-foreground/60"
              }`}
            >
              Admin
            </Link>
            <Link
              href="/admin/agent"
              className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/admin/agent" ? "text-primary" : "text-foreground/60"
              }`}
            >
              Agent Dashboard
            </Link>
            {!isLoading && (
              <>
                {user ? (
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
