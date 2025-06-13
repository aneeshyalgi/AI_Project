import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
import { WebXRProvider } from "@/app/components/WebXRProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Swisscom AI Customer Service Avatar",
  description: "An AI-powered customer service avatar for Swisscom",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            {/* runs the Looking Glass polyfill on the client */}
            <WebXRProvider />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
