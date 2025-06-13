// app/components/WebXRProvider.tsx
"use client"

import { useEffect } from "react"

export function WebXRProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return

    import("@lookingglass/webxr")
      .then(({ LookingGlassWebXRPolyfill, LookingGlassConfig }) => {
        // Tweak your display params:
        LookingGlassConfig.targetY    = 0
        LookingGlassConfig.targetZ    = 0
        LookingGlassConfig.targetDiam = 3
        LookingGlassConfig.fovy       = (40 * Math.PI) / 180

        // Now instantiate the polyfill
        new LookingGlassWebXRPolyfill()
      })
      .catch((err) => {
        console.warn("Could not load Looking Glass WebXR polyfill:", err)
      })
  }, [])

  return null
}
