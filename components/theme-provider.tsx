"use client"

import type * as React from "react"

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
}

export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  return <>{children}</>
}

