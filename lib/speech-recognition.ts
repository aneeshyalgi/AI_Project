// Check if the Web Speech API is available
export const isSpeechRecognitionSupported = () => {
  try {
    return (
      typeof window !== "undefined" &&
      (typeof window.SpeechRecognition !== "undefined" || typeof window.webkitSpeechRecognition !== "undefined")
    )
  } catch (error) {
    console.error("Error checking speech recognition support:", error)
    return false
  }
}

// Create a speech recognition instance
export const createSpeechRecognition = () => {
  if (!isSpeechRecognitionSupported()) {
    console.warn("Speech recognition is not supported in this browser")
    return null
  }

  try {
    // Use the appropriate constructor
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition API not available")
      return null
    }

    const recognition = new SpeechRecognitionAPI()

    // Configure the recognition with more resilient settings
    recognition.continuous = false
    recognition.interimResults = true
    // recognition.maxAlternatives is not supported on the SpeechRecognition instance
    recognition.lang = "en-US" // Default to English for better compatibility

    return recognition
  } catch (error) {
    console.error("Error creating speech recognition:", error)
    return null
  }
}

// Helper function to request microphone permissions explicitly
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("MediaDevices API not supported in this browser")
      return false
    }

    // Request microphone access
    await navigator.mediaDevices.getUserMedia({ audio: true })
    return true
  } catch (error) {
    console.error("Error requesting microphone permission:", error)
    return false
  }
}

// Check if microphone is accessible
export const checkMicrophoneAccess = async (): Promise<{
  available: boolean
  permission: "granted" | "denied" | "prompt" | "unknown"
}> => {
  try {
    // Check if the browser supports the permissions API
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName })

      return {
        available: true,
        permission: permissionStatus.state as "granted" | "denied" | "prompt",
      }
    }

    // Fallback for browsers that don't support the permissions API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop all tracks to release the microphone
      stream.getTracks().forEach((track) => track.stop())
      return { available: true, permission: "granted" }
    } catch (error) {
      return { available: false, permission: "denied" }
    }
  } catch (error) {
    console.error("Error checking microphone access:", error)
    return { available: false, permission: "unknown" }
  }
}

// Add a function to check network connectivity specifically for speech recognition
export const checkNetworkForSpeechRecognition = async (): Promise<boolean> => {
  try {
    // First check basic online status
    if (!navigator.onLine) {
      return false
    }

    // Try to reach Google's speech recognition servers
    // This is a lightweight ping to check connectivity to speech services
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    try {
      const response = await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response.ok
    } catch (e) {
      console.warn("Network check failed:", e)
      return false
    }
  } catch (error) {
    console.error("Error checking network for speech recognition:", error)
    return false
  }
}

// Add a function to handle network errors with exponential backoff
export const handleNetworkError = (() => {
  let retryCount = 0
  let lastRetryTime = 0
  const maxRetries = 5

  return {
    shouldRetry: () => {
      const now = Date.now()

      // If it's been more than 5 minutes since the last retry, reset the counter
      if (now - lastRetryTime > 5 * 60 * 1000) {
        retryCount = 0
      }

      if (retryCount >= maxRetries) {
        return false
      }

      retryCount++
      lastRetryTime = now
      return true
    },

    getRetryDelay: () => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      return Math.min(1000 * Math.pow(2, retryCount - 1), 16000)
    },

    reset: () => {
      retryCount = 0
    },
  }
})()
