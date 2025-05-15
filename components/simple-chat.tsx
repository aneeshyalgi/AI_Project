"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // Add user message to state
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      console.log("Sending message to API:", input)

      // Call the simplified test API
      const response = await fetch("/api/chat-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      })

      console.log("API response status:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      // Process streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log("Stream complete")
          break
        }

        const chunk = decoder.decode(value)
        console.log("Received chunk:", chunk)

        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)

            if (data === "[DONE]") {
              continue
            }

            try {
              const { text } = JSON.parse(data)
              assistantMessage += text

              // Update messages with current accumulated response
              setMessages((prev) => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]

                if (lastMessage && lastMessage.role === "assistant") {
                  lastMessage.content = assistantMessage
                  return newMessages
                } else {
                  return [...prev, { role: "assistant", content: assistantMessage }]
                }
              })
            } catch (error) {
              console.error("Error parsing SSE data:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="flex flex-col h-[500px]">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-muted-foreground">Send a message to start the conversation</p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg mb-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                      : "bg-gray-100 mr-auto max-w-[80%]"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2 mr-auto max-w-[80%]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
