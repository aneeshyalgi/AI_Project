"use client"

import { useState, useEffect } from "react"

/**
 * A hook that returns true when the component is mounted on the client side.
 * Use this to safely render components that use browser APIs.
 */
export function useClientSide() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}
