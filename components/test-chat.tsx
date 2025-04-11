"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function TestChat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setInput("")

    try {
      // Call the API directly
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      let assistantMessage = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value)
        console.log("Received chunk:", chunk)

        // Parse the chunk as SSE
        const lines = chunk.split("\n\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ""
              assistantMessage += content
            } catch (e) {
              console.error("Error parsing JSON:", e)
            }
          }
        }

        // Update the UI with the current accumulated message
        setMessages((prev) => {
          const newMessages = [...prev]
          // Check if we already have an assistant message
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.role === "assistant") {
            // Update the existing message
            lastMessage.content = assistantMessage
            return [...newMessages]
          } else {
            // Add a new assistant message
            return [...newMessages, { role: "assistant", content: assistantMessage }]
          }
        })
      }
    } catch (error) {
      console.error("Error fetching response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`p-2 rounded ${message.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
              <strong>{message.role === "user" ? "You" : "AI"}:</strong> {message.content}
            </div>
          ))}
          {isLoading && <div className="p-2 bg-gray-100 rounded">AI is typing...</div>}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

