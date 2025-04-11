"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatMessage } from "@/types/chat"
import { motion } from "framer-motion"

interface AvatarAnimationProps {
  messages: ChatMessage[]
}

export default function AvatarAnimation({ messages }: AvatarAnimationProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentExpression, setCurrentExpression] = useState("neutral")

  // Detect when a new assistant message arrives
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant") {
      // Start speaking animation
      setIsSpeaking(true)

      // Analyze message sentiment to set expression
      const message = lastMessage.content.toLowerCase()
      if (message.includes("sorry") || message.includes("apologize") || message.includes("unfortunately")) {
        setCurrentExpression("sad")
      } else if (message.includes("great") || message.includes("excellent") || message.includes("happy")) {
        setCurrentExpression("happy")
      } else {
        setCurrentExpression("neutral")
      }

      // Stop speaking after a delay based on message length
      const speakingTime = Math.min(Math.max(lastMessage.content.length * 50, 2000), 8000)
      const timer = setTimeout(() => {
        setIsSpeaking(false)
      }, speakingTime)

      return () => clearTimeout(timer)
    }
  }, [messages])

  return (
    <div className="relative">
      <motion.div
        animate={
          isSpeaking
            ? {
                scale: [1, 1.05, 1],
                transition: { repeat: Number.POSITIVE_INFINITY, duration: 1.5 },
              }
            : {}
        }
      >
        <Avatar className="h-32 w-32 border-4 border-primary">
          <AvatarImage src="/placeholder.svg?height=128&width=128" />
          <AvatarFallback className="text-4xl">AI</AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Expression indicator */}
      <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border-2 border-primary">
        {currentExpression === "happy" && (
          <span className="text-2xl" role="img" aria-label="happy">
            😊
          </span>
        )}
        {currentExpression === "sad" && (
          <span className="text-2xl" role="img" aria-label="sad">
            😔
          </span>
        )}
        {currentExpression === "neutral" && (
          <span className="text-2xl" role="img" aria-label="neutral">
            😐
          </span>
        )}
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <motion.div
          className="absolute -bottom-2 -left-2 bg-green-500 rounded-full h-6 w-6 flex items-center justify-center"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
        >
          <span className="sr-only">Speaking</span>
          <span className="block h-2 w-2 rounded-full bg-white"></span>
        </motion.div>
      )}
    </div>
  )
}

