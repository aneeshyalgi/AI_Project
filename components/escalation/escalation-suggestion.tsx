"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import type { EscalationState } from "@/lib/escalation-service"

interface EscalationSuggestionProps {
  escalationState: EscalationState
  onRequestAgent: () => void
}

export function EscalationSuggestion({ escalationState, onRequestAgent }: EscalationSuggestionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show suggestion if we're approaching escalation thresholds but not yet triggering automatic escalation
    const shouldShowSuggestion =
      (escalationState.confusionScore > 0.5 && escalationState.confusionScore < 0.7) ||
      (escalationState.frustrationScore > 0.4 && escalationState.frustrationScore < 0.6) ||
      (escalationState.failedAttempts >= 2 && escalationState.failedAttempts < 3)

    setVisible(shouldShowSuggestion)
  }, [escalationState])

  if (!visible) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
      <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 mb-2">
          Would you like to speak with a human customer service representative? They might be able to help with your
          specific issue.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={onRequestAgent}
        >
          Connect with an agent
        </Button>
      </div>
    </div>
  )
}
