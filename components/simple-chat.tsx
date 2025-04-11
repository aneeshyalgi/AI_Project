"use client"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function SimpleChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      console.log("Chat finished:", message)
    },
  })

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Simple Chat Test</CardTitle>
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
          <Input value={input} onChange={handleInputChange} placeholder="Type a message..." disabled={isLoading} />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

