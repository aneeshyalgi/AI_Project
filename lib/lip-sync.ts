// Map of phonemes to mouth openness values
// This is a simplified version - professional lip sync would use more detailed visemes
const PHONEME_MAP: Record<string, number> = {
    // Closed mouth sounds
    b: 0.1,
    m: 0.1,
    p: 0.1,
  
    // Slightly open mouth sounds
    d: 0.2,
    n: 0.2,
    t: 0.2,
    s: 0.2,
    z: 0.2,
  
    // Medium open mouth sounds
    r: 0.4,
    l: 0.4,
    j: 0.4,
  
    // Open mouth sounds
    a: 0.7,
    e: 0.6,
    i: 0.5,
    o: 0.7,
    u: 0.5,
  
    // Wide open mouth sounds
    æ: 0.8,
    ɑ: 0.9,
    ɔ: 0.8,
  }
  
  // Default openness for sounds not in the map
  const DEFAULT_OPENNESS = 0.3
  
  // Duration of each mouth position in milliseconds
  const PHONEME_DURATION = 100
  
  // Simple function to estimate mouth openness based on text
  export function analyzeSpeech(text: string): { time: number; openness: number }[] {
    const sequence: { time: number; openness: number }[] = []
  
    // Convert to lowercase for matching
    const lowerText = text.toLowerCase()
  
    // Process each character
    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i]
  
      // Skip spaces and punctuation
      if (/[a-z]/.test(char)) {
        const openness = PHONEME_MAP[char] || DEFAULT_OPENNESS
        sequence.push({
          time: i * PHONEME_DURATION,
          openness,
        })
      }
    }
  
    return sequence
  }
  
  // Class to manage lip sync animation
  export class LipSyncAnimator {
    private sequence: { time: number; openness: number }[] = []
    private startTime = 0
    private isActive = false
    private text = ""
  
    // Start lip sync animation with given text
    start(text: string) {
      this.text = text
      this.sequence = analyzeSpeech(text)
      this.startTime = Date.now()
      this.isActive = true
    }
  
    // Stop the animation
    stop() {
      this.isActive = false
    }
  
    // Get current mouth openness value
    getCurrentOpenness(): number {
      if (!this.isActive || this.sequence.length === 0) {
        return 0
      }
  
      const elapsed = Date.now() - this.startTime
  
      // Find the appropriate mouth position based on elapsed time
      for (let i = this.sequence.length - 1; i >= 0; i--) {
        if (elapsed >= this.sequence[i].time) {
          // Add some randomness for more natural movement
          const randomFactor = Math.random() * 0.2 - 0.1 // -0.1 to 0.1
          return Math.max(0, Math.min(1, this.sequence[i].openness + randomFactor))
        }
      }
  
      return 0
    }
  
    // Check if animation is still active
    isAnimating(): boolean {
      if (!this.isActive) return false
  
      // Check if we've reached the end of the sequence
      const elapsed = Date.now() - this.startTime
      const lastTime = this.sequence.length > 0 ? this.sequence[this.sequence.length - 1].time + PHONEME_DURATION * 2 : 0
  
      return elapsed < lastTime
    }
  }
  
  // Create a singleton instance
  export const lipSyncAnimator = new LipSyncAnimator()
  