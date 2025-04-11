"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, Send, StopCircle, VolumeX, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SwisscomAvatar3D from "./swisscom-avatar-3d"
import { playTextToSpeech, stopTextToSpeech } from "@/lib/text-to-speech"

interface CustomerServiceAvatarProps {
  userId: string
}

// TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function CustomerServiceAvatar({ userId }: CustomerServiceAvatarProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [userInput, setUserInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  // Set loaded state immediately in development mode
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")

        setUserInput(transcript)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      // Stop any playing audio when component unmounts
      stopTextToSpeech()
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
      setIsListening(true)
    }
  }

  const toggleAudio = () => {
    if (isSpeaking) {
      stopTextToSpeech()
      setIsSpeaking(false)
    }
    setAudioEnabled(!audioEnabled)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isListening) {
      toggleListening()
    }

    if (!userInput.trim() || isProcessing) return

    // Add user message to chat
    const userMessage = { role: "user", content: userInput }
    setChatMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)

    try {
      // Call the API directly
      const response = await fetch("/api/chat-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
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

              // Update the UI with the current accumulated message
              setChatMessages((prev) => {
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
            } catch (e) {
              console.error("Error parsing JSON:", e)
            }
          }
        }
      }

      // Play text-to-speech if enabled
      if (audioEnabled && assistantMessage) {
        setIsSpeaking(true)
        await playTextToSpeech(assistantMessage)
        setIsSpeaking(false)
      }
    } catch (error) {
      console.error("Error fetching response:", error)
    } finally {
      setUserInput("")
      setIsProcessing(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  // If not loaded yet, don't render anything
  if (!isLoaded) {
    return null
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-6">
      <div className="w-full flex justify-end">
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
        <SwisscomAvatar3D isSpeaking={isSpeaking} messages={chatMessages} />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Swisscom Customer Service</CardTitle>
          <CardDescription>Ask me anything about Swisscom products or services</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] overflow-y-auto">
          <div className="space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                Start a conversation to get help with Swisscom services
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-3",
                    message.role === "user"
                      ? "ml-auto bg-blue-600 text-white w-4/5 md:w-3/5"
                      : "bg-muted w-4/5 md:w-3/5",
                  )}
                >
                  {message.role !== "user" && (
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">SC</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p>{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-800 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">You</span>
                    </div>
                  )}
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex items-start gap-3 rounded-lg p-3 bg-muted w-4/5 md:w-3/5">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">SC</span>
                </div>
                <div className="flex-1">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="button" size="icon" variant={audioEnabled ? "default" : "outline"} onClick={toggleAudio}>
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleListening}
            >
              {isListening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="submit" disabled={isProcessing || userInput.trim() === ""}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

