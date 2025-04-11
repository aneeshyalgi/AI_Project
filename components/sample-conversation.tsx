"use client"

import { Button } from "@/components/ui/button"
import { useChat } from "ai/react"

export default function SampleConversation() {
  const { setMessages } = useChat()

  const loadSampleConversation = () => {
    setMessages([
      { id: "1", role: "user", content: "Hello, I need information about Swisscom mobile plans." },
      {
        id: "2",
        role: "assistant",
        content:
          "Hello! I'd be happy to help you with information about Swisscom mobile plans. Swisscom offers a range of mobile subscriptions including inOne mobile, which provides unlimited calls, SMS, and data within Switzerland. Plans vary from basic to premium with different international options and speeds. What specific information are you looking for?",
      },
      { id: "3", role: "user", content: "What's the best plan for international roaming?" },
      {
        id: "4",
        role: "assistant",
        content:
          "For international roaming, Swisscom offers several options:\n\n1. **inOne mobile premium** - This is our top-tier plan that includes roaming in many countries worldwide with generous data allowances.\n\n2. **Travel options** - These can be added to any subscription and provide data, calls, and SMS abroad with various packages depending on your destination and duration.\n\n3. **Travel Day Pass** - For occasional travelers, this gives you 24 hours of usage in many countries.\n\nIf you travel frequently, especially to Europe, the inOne mobile premium would be the most convenient option as it includes roaming in many countries without additional charges. Would you like more specific details about any of these options?",
      },
    ])
  }

  return (
    <div className="flex justify-center my-4">
      <Button onClick={loadSampleConversation} variant="outline">
        Load Sample Conversation
      </Button>
    </div>
  )
}

