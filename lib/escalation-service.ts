import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/types/chat"

// Threshold values for escalation triggers
const CONFUSION_THRESHOLD = 0.7
const FRUSTRATION_THRESHOLD = 0.6
const MAX_FAILED_ATTEMPTS = 3

// Keywords that might indicate a user wants to speak to a human
const HUMAN_REQUEST_KEYWORDS = [
  "speak to a human",
  "talk to a person",
  "real person",
  "human agent",
  "speak to someone",
  "talk to a representative",
  "speak to an agent",
  "connect me with",
]

// Keywords that might indicate complex issues
const COMPLEX_ISSUE_KEYWORDS = [
  "contract termination",
  "legal",
  "complaint",
  "refund",
  "cancel subscription",
  "technical problem",
  "not working",
  "broken",
  "dispute",
]

export interface EscalationState {
  shouldEscalate: boolean
  reason: EscalationReason | null
  failedAttempts: number
  confusionScore: number
  frustrationScore: number
}

export type EscalationReason =
  | "user_requested"
  | "multiple_failures"
  | "detected_frustration"
  | "complex_issue"
  | "agent_requested"

// Initialize escalation state
export const initialEscalationState: EscalationState = {
  shouldEscalate: false,
  reason: null,
  failedAttempts: 0,
  confusionScore: 0,
  frustrationScore: 0,
}

// Check if the user is explicitly requesting a human
export function detectHumanRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return HUMAN_REQUEST_KEYWORDS.some((keyword) => lowerMessage.includes(keyword))
}

// Check if the issue seems complex based on keywords
export function detectComplexIssue(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return COMPLEX_ISSUE_KEYWORDS.some((keyword) => lowerMessage.includes(keyword))
}

// Analyze user message for confusion or frustration
// In a real implementation, this would use sentiment analysis or a more sophisticated AI model
export function analyzeUserSentiment(message: string): { confusion: number; frustration: number } {
  const lowerMessage = message.toLowerCase()

  // Simple keyword-based detection (would be replaced with ML model)
  const confusionKeywords = ["don't understand", "confused", "unclear", "what do you mean", "not sure"]
  const frustrationKeywords = ["frustrated", "annoyed", "unhelpful", "useless", "waste of time", "not working"]

  let confusionScore = 0
  let frustrationScore = 0

  confusionKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) confusionScore += 0.3
  })

  frustrationKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) frustrationScore += 0.3
  })

  // Check for punctuation that might indicate frustration
  if ((lowerMessage.match(/\?/g) || []).length > 2) confusionScore += 0.2
  if ((lowerMessage.match(/!/g) || []).length > 1) frustrationScore += 0.2

  // Cap scores at 1.0
  return {
    confusion: Math.min(confusionScore, 1.0),
    frustration: Math.min(frustrationScore, 1.0),
  }
}

// Update escalation state based on new messages
export function updateEscalationState(
  currentState: EscalationState,
  userMessage: string,
  aiResponse: string,
): EscalationState {
  // Clone the current state
  const newState = { ...currentState }

  // Check for explicit human request
  if (detectHumanRequest(userMessage)) {
    return {
      ...newState,
      shouldEscalate: true,
      reason: "user_requested",
    }
  }

  // Check for complex issue
  if (detectComplexIssue(userMessage)) {
    return {
      ...newState,
      shouldEscalate: true,
      reason: "complex_issue",
    }
  }

  // Analyze sentiment
  const sentiment = analyzeUserSentiment(userMessage)
  newState.confusionScore = sentiment.confusion
  newState.frustrationScore = sentiment.frustration

  // Check for confusion threshold
  if (sentiment.confusion > CONFUSION_THRESHOLD) {
    newState.failedAttempts += 1
  }

  // Check for frustration threshold
  if (sentiment.frustration > FRUSTRATION_THRESHOLD) {
    return {
      ...newState,
      shouldEscalate: true,
      reason: "detected_frustration",
    }
  }

  // Check for multiple failed attempts
  if (newState.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return {
      ...newState,
      shouldEscalate: true,
      reason: "multiple_failures",
    }
  }

  // If AI response contains an admission of inability to help
  if (
    aiResponse.toLowerCase().includes("i can't help with that") ||
    aiResponse.toLowerCase().includes("beyond my capabilities") ||
    aiResponse.toLowerCase().includes("would you like to speak to a human agent")
  ) {
    newState.failedAttempts += 1
  }

  return newState
}

// Get estimated wait time for human agents
export async function getEstimatedWaitTime(): Promise<number> {
  try {
    const supabase = createClient()

    // Check if we have a valid Supabase client
    if (!supabase) {
      console.warn("Supabase client not available, using default wait time")
      return 5
    }

    const { data, error } = await supabase.from("agent_availability").select("estimated_wait_time").single()

    if (error) {
      // Handle PGRST116 (no rows) differently than other errors
      if (error.code === "PGRST116") {
        console.log("No agent availability data found, using default wait time")
      } else {
        console.error("Error fetching wait time:", error.message || error)
      }
      return 5 // Default to 5 minutes if error
    }

    return data?.estimated_wait_time || 5 // Default to 5 minutes if no data
  } catch (error) {
    // Safely log the error without causing React rendering issues
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error in getEstimatedWaitTime:", errorMessage)
    return 5 // Default to 5 minutes on error
  }
}

// Save conversation context for agent handover
export async function saveConversationContext(
  conversationId: string,
  messages: Message[],
  userId: string,
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("agent_handovers").insert([
      {
        conversation_id: conversationId,
        user_id: userId,
        conversation_history: messages,
        status: "waiting",
        requested_at: new Date().toISOString(),
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error saving conversation context:", error)
    return false
  }
}
