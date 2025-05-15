// Simple audio-based speech solution that doesn't rely on the Web Speech API

// Check if Audio API is available
export const isAudioSupported = () => {
    return typeof window !== "undefined" && typeof Audio !== "undefined"
  }
  
  // Map of pre-recorded audio files for common phrases
  const commonPhrases: Record<string, string> = {
    greeting: "/audio/greeting.mp3",
    goodbye: "/audio/goodbye.mp3",
    help: "/audio/help.mp3",
    error: "/audio/error.mp3",
  }
  
  // Audio instance for playing sounds
  let audioInstance: HTMLAudioElement | null = null
  
  // Function to find the best matching pre-recorded audio
  const findBestMatchingAudio = (text: string): string | null => {
    // Convert to lowercase for matching
    const lowerText = text.toLowerCase()
  
    // Check for common phrases
    if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("welcome")) {
      return commonPhrases.greeting
    }
  
    if (lowerText.includes("goodbye") || lowerText.includes("bye") || lowerText.includes("thank you")) {
      return commonPhrases.goodbye
    }
  
    if (lowerText.includes("help") || lowerText.includes("assist") || lowerText.includes("support")) {
      return commonPhrases.help
    }
  
    if (lowerText.includes("sorry") || lowerText.includes("error") || lowerText.includes("problem")) {
      return commonPhrases.error
    }
  
    // No match found
    return null
  }
  
  // Function to play a notification sound instead of speaking
  export const playNotificationSound = (onEnd?: () => void) => {
    if (!isAudioSupported()) {
      if (onEnd) onEnd()
      return
    }
  
    try {
      // Stop any currently playing audio
      if (audioInstance) {
        audioInstance.pause()
        audioInstance = null
      }
  
      // Create a new audio instance
      const audio = new Audio("/audio/notification.mp3")
      audioInstance = audio
  
      // Set up event handlers
      audio.onended = () => {
        if (onEnd) onEnd()
        audioInstance = null
      }
  
      audio.onerror = () => {
        console.error("Error playing notification sound")
        if (onEnd) onEnd()
        audioInstance = null
      }
  
      // Play the audio
      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
        if (onEnd) onEnd()
        audioInstance = null
      })
    } catch (error) {
      console.error("Error in audio playback:", error)
      if (onEnd) onEnd()
    }
  }
  
  // Function to speak text using pre-recorded audio or fallback to notification
  export const speakWithAudio = (text: string, onEnd?: () => void) => {
    if (!isAudioSupported()) {
      if (onEnd) onEnd()
      return
    }
  
    try {
      // Stop any currently playing audio
      if (audioInstance) {
        audioInstance.pause()
        audioInstance = null
      }
  
      // Find the best matching audio file
      const audioFile = findBestMatchingAudio(text)
  
      if (audioFile) {
        // Create a new audio instance
        const audio = new Audio(audioFile)
        audioInstance = audio
  
        // Set up event handlers
        audio.onended = () => {
          if (onEnd) onEnd()
          audioInstance = null
        }
  
        audio.onerror = () => {
          console.error("Error playing audio")
          // Fallback to notification sound
          playNotificationSound(onEnd)
        }
  
        // Play the audio
        audio.play().catch((error) => {
          console.error("Error playing audio:", error)
          // Fallback to notification sound
          playNotificationSound(onEnd)
        })
      } else {
        // No matching audio file, play notification sound
        playNotificationSound(onEnd)
      }
    } catch (error) {
      console.error("Error in audio playback:", error)
      if (onEnd) onEnd()
    }
  }
  
  // Function to stop any playing audio
  export const stopAudio = () => {
    if (audioInstance) {
      try {
        audioInstance.pause()
        audioInstance = null
      } catch (error) {
        console.error("Error stopping audio:", error)
      }
    }
  }
  