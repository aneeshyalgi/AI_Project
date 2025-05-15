"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { RealisticAvatar } from "./realistic-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Info, AlertTriangle } from 'lucide-react'
import {
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported,
  isSpeechDisabled,
  resetSpeechSynthesis,
} from "@/lib/text-to-speech"
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  checkMicrophoneAccess,
} from "@/lib/speech-recognition"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

type UserSettings = {
  voiceLanguage: string
  voiceRate: string
  aiModel: string
  temperature: string
}

export function CustomerServiceAvatar({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [avatarMood, setAvatarMood] = useState<"neutral" | "happy" | "thinking">("neutral")
  const [userSettings, setUserSettings] = useState<UserSettings>({
    voiceLanguage: "en-US",
    voiceRate: "1",
    aiModel: "gpt-4o",
    temperature: "0.7",
  })
  const [speechError, setSpeechError] = useState(false)
  const [micPermissionDialog, setMicPermissionDialog] = useState(false)
  const [micStatus, setMicStatus] = useState<{
    available: boolean
    permission: "granted" | "denied" | "prompt" | "unknown"
  }>({ available: false, permission: "unknown" })
  const [recognitionText, setRecognitionText] = useState("")
  // Add a network status state
  const [isOnline, setIsOnline] = useState(true)
  const [recognitionErrorCount, setRecognitionErrorCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognition = useRef<any>(null)
  const supabase = createClient()

  // Fetch user settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("settings").select("*").eq("user_id", userId).single()

        if (error) {
          if (error.code !== "PGRST116") {
            // PGRST116 is "no rows returned" - not an error for us
            console.error("Error fetching settings:", error)
          }
          return
        }

        if (data) {
          setUserSettings({
            voiceLanguage: data.voice_language || "en-US",
            voiceRate: data.voice_rate || "1",
            aiModel: data.ai_model || "gpt-4o",
            temperature: data.temperature || "0.7",
          })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }

    if (userId) {
      fetchSettings()
    }
  }, [userId, supabase])

  // Check microphone status on mount
  useEffect(() => {
    const checkMic = async () => {
      if (typeof window !== "undefined") {
        const status = await checkMicrophoneAccess()
        setMicStatus(status)
        console.log("Microphone status:", status)
      }
    }

    checkMic()
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && isSpeechRecognitionSupported()) {
      recognition.current = createSpeechRecognition()

      if (recognition.current) {
        // Handle interim results for more responsive feedback
        recognition.current.onresult = (event: any) => {
          const results = event.results
          const latestResult = results[results.length - 1]
          const transcript = latestResult[0].transcript

          // Update the recognition text in real-time
          setRecognitionText(transcript)

          // If this is a final result, use it
          if (latestResult.isFinal) {
            setInput(transcript)

            // Only auto-submit if we have a final result and it's not too short
            if (transcript.trim().length > 2) {
              setTimeout(() => {
                handleSubmit(new Event("submit") as any)
              }, 500)
            }
          }
        }

        recognition.current.onend = () => {
          setIsListening(false)
          // Clear the recognition text if we didn't use it
          setRecognitionText("")
        }

        recognition.current.onerror = (event: any) => {
          // Safely extract error information without stringifying the entire event
          const errorType = event.error || "unknown"
          console.error("Speech recognition error:", errorType)
          
          // Increment error counter
          setRecognitionErrorCount(prev => prev + 1)
          
          setIsListening(false)
          setRecognitionText("")

          // Handle specific error types
          if (errorType === "network") {
            console.log("Network error in speech recognition - will retry automatically")
            // Show network error message
            setRecognitionText("Network error detected. Retrying...")

            // Retry after a short delay, but only if we haven't had too many errors
            if (recognitionErrorCount < 3) {
              setTimeout(() => {
                if (!isListening) {
                  startListening()
                }
              }, 3000)
            } else {
              // Too many errors, show a message and don't retry
              setMessages((prev) => [
                ...prev,
                {
                  role: "system",
                  content: "Multiple network errors detected. Please check your internet connection and try again later.",
                },
              ])
              // Reset error count after a while
              setTimeout(() => setRecognitionErrorCount(0), 30000)
            }
          } else if (errorType === "not-allowed") {
            setMicStatus({ available: false, permission: "denied" })
            setMicPermissionDialog(true)
          } else if (errorType === "aborted") {
            // User or system aborted - no need for error message
            console.log("Speech recognition aborted")
          } else {
            // For other errors, update UI to show the error
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                content: `Speech recognition error: ${errorType}. Please try typing your message instead.`,
              },
            ])
          }
        }
      }
    }

    return () => {
      if (recognition.current) {
        try {
          recognition.current.abort()
        } catch (error) {
          console.error("Error aborting recognition:", error)
        }
      }
    }
  }, [recognitionErrorCount])

  // Check for speech synthesis issues
  useEffect(() => {
    setSpeechError(isSpeechDisabled())
  }, [isSpeaking])

  // Add a network status effect
  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Monitor network status changes
    const handleNetworkChange = () => {
      console.log("Network status changed. Online:", navigator.onLine)
      setIsOnline(navigator.onLine)

      // If we were listening and went offline, stop listening
      if (!navigator.onLine && isListening) {
        if (recognition.current) {
          try {
            recognition.current.abort()
          } catch (e) {
            console.error("Error aborting recognition on network change:", e)
          }
        }
        setIsListening(false)
        setRecognitionText("")

        // Notify user
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Network connection lost. Voice input has been disabled. Please check your internet connection.",
          },
        ])
      }
    }

    // Add event listeners for online/offline events
    window.addEventListener("online", handleNetworkChange)
    window.addEventListener("offline", handleNetworkChange)

    // Clean up
    return () => {
      window.removeEventListener("online", handleNetworkChange)
      window.removeEventListener("offline", handleNetworkChange)
    }
  }, [isListening, recognition])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    console.log("Submitting message:", input)

    // Add user message to state
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setRecognitionText("")
    setIsLoading(true)
    setAvatarMood("thinking")

    try {
      // Stop any ongoing speech
      if (isSpeaking) {
        stopSpeaking()
        setIsSpeaking(false)
      }

      // Prepare messages for API
      const messagesToSend = [...messages, userMessage]

      console.log("Sending messages to API:", messagesToSend)

      // Call API with user settings
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
          userId,
          conversationId,
          settings: {
            model: userSettings.aiModel,
            temperature: Number.parseFloat(userSettings.temperature),
          },
        }),
      })

      console.log("API response status:", response.status)

      // Check for conversation ID in headers
      const conversationIdHeader = response.headers.get("X-Conversation-Id")
      if (conversationIdHeader) {
        setConversationId(conversationIdHeader)
      }

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

      console.log("Processing response stream")

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

      console.log("Final assistant message:", assistantMessage)

      // Set avatar mood based on response content
      if (assistantMessage.includes("sorry") || assistantMessage.includes("apologize")) {
        setAvatarMood("neutral")
      } else {
        setAvatarMood("happy")
      }

      // Speak the response if audio is enabled
      if (audioEnabled && typeof window !== "undefined" && isSpeechSynthesisSupported()) {
        setIsSpeaking(true)
        speakText(assistantMessage, () => {
          setIsSpeaking(false)
          setAvatarMood("neutral")
        })
      } else {
        // If not speaking, reset mood after a delay
        setTimeout(() => {
          setAvatarMood("neutral")
        }, 2000)
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
      setAvatarMood("neutral")
    } finally {
      setIsLoading(false)
      // Focus input after response
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  // Toggle speech recognition with permission handling
  const toggleListening = async () => {
    if (isListening) {
      if (recognition.current) {
        try {
          recognition.current.abort()
        } catch (error) {
          console.error("Error stopping recognition:", error)
        }
      }
      setIsListening(false)
      setRecognitionText("")
    } else {
      // Check microphone permission status
      const status = await checkMicrophoneAccess()
      setMicStatus(status)

      if (status.permission === "granted") {
        startListening()
      } else if (status.permission === "prompt") {
        // Request permission explicitly
        const granted = await requestMicrophonePermission()
        if (granted) {
          startListening()
        } else {
          setMicPermissionDialog(true)
        }
      } else {
        // Permission denied or unknown
        setMicPermissionDialog(true)
      }
    }
  }

  // Start listening after permissions are granted
  const startListening = () => {
    if (recognition.current) {
      try {
        // Check for network connectivity first
        if (!navigator.onLine) {
          console.warn("Device appears to be offline. Speech recognition may not work properly.")
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content:
                "Your device appears to be offline. Voice input may not work properly. Please check your internet connection.",
            },
          ])
        }

        // Reset error count when starting a new session
        setRecognitionErrorCount(0)

        // Add a timeout to detect if recognition doesn't start properly
        const recognitionTimeout = setTimeout(() => {
          if (isListening) {
            console.warn("Speech recognition may have stalled - resetting")
            try {
              recognition.current.abort()
            } catch (e) {
              console.error("Error aborting stalled recognition:", e)
            }
            setIsListening(false)
            setRecognitionText("Recognition timed out. Please try again.")
          }
        }, 10000) // 10 second timeout

        // Start recognition
        recognition.current.start()
        setIsListening(true)
        setRecognitionText("Listening...")

        // Clear timeout when recognition ends
        recognition.current.onend = () => {
          clearTimeout(recognitionTimeout)
          setIsListening(false)
          setRecognitionText("")
        }
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        setIsListening(false)
        setRecognitionText("")

        // Show error message to user
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "There was a problem starting voice recognition. Please try again or use text input instead.",
          },
        ])
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    }
    setAudioEnabled(!audioEnabled)

    // If enabling audio and speech was disabled due to errors, try to reset
    if (!audioEnabled && isSpeechDisabled()) {
      resetSpeechSynthesis()
      setSpeechError(false)
    }
  }

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 h-[70vh]">
      <div className="order-2 md:order-1 h-full flex flex-col">
        <Card className="flex-1 overflow-hidden flex flex-col shadow-lg border-swisscom-blue/20">
          <CardContent className="flex-1 overflow-y-auto p-4 pt-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-swisscom-blue/10 flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-swisscom-blue" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Swisscom AI Assistant</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  How can I help you today? You can ask me about Swisscom products, services, or support.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {[
                    "What mobile plans do you offer?",
                    "How can I check my bill?",
                    "I need help with my internet connection",
                    "Tell me about Swisscom TV",
                  ].map((suggestion, index) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 animate-slide-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        setInput(suggestion)
                        setTimeout(() => {
                          handleSubmit(new Event("submit") as any)
                        }, 100)
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 px-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                    style={{ animationDelay: `${0.1}s` }}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-swisscom-blue text-white text-xs">SC</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] p-3 shadow-sm",
                        message.role === "user" 
                          ? "message-bubble-user" 
                          : message.role === "system"
                            ? "bg-yellow-100 text-yellow-800 rounded-lg"
                            : "message-bubble-assistant",
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 ml-2">
                        <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">YOU</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-swisscom-blue text-white text-xs">SC</AvatarFallback>
                    </Avatar>
                    <div className="message-bubble-assistant py-4 px-4">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t">
            {speechError && (
              <div className="mb-2 p-2 bg-yellow-50 text-yellow-800 rounded-md flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Speech synthesis is temporarily disabled due to errors. Text responses will still work.</span>
              </div>
            )}

            {/* Show recognition text when listening */}
            {isListening && recognitionText && (
              <div className="mb-2 p-2 bg-blue-50 text-blue-800 rounded-md flex items-center text-sm">
                <Mic className="h-4 w-4 mr-2" />
                <span>{recognitionText}</span>
              </div>
            )}
            {!isOnline && (
              <div className="mb-2 p-2 bg-red-50 text-red-800 rounded-md flex items-center text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>You are currently offline. Voice input and some features may not work properly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex space-x-2" suppressHydrationWarning>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? "default" : "outline"}
                      onClick={toggleListening}
                      disabled={typeof window === "undefined" || !isSpeechRecognitionSupported() || recognitionErrorCount >= 5}
                      className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
                      suppressHydrationWarning
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening 
                      ? "Stop listening" 
                      : recognitionErrorCount >= 5 
                        ? "Voice input temporarily disabled due to errors" 
                        : "Start voice input"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                disabled={isLoading || isListening}
                className="flex-1 border-swisscom-blue/20 focus-visible:ring-swisscom-blue/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                suppressHydrationWarning
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={toggleAudio}
                      disabled={typeof window === "undefined" || !isSpeechSynthesisSupported()}
                      suppressHydrationWarning
                    >
                      {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{audioEnabled ? "Disable voice responses" : "Enable voice responses"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-swisscom-blue hover:bg-swisscom-blue/90"
                suppressHydrationWarning
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </form>

            <div className="flex justify-between items-center mt-2 px-1">
              <div className="flex items-center">
                {isSpeaking && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-swisscom-blue/10 text-swisscom-blue border-swisscom-blue/20"
                  >
                    Speaking
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {messages.length > 0 && `${messages.length} messages`}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="order-1 md:order-2 h-full">
        <Card className="h-full overflow-hidden shadow-lg border-swisscom-blue/20">
          <CardContent className="h-full p-0 relative">
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-swisscom-blue">
                {isSpeaking ? "Speaking" : isLoading ? "Thinking" : isListening ? "Listening" : "Ready"}
              </Badge>
            </div>
            <RealisticAvatar mood={avatarMood} isSpeaking={isSpeaking} />
          </CardContent>
        </Card>
      </div>

      {/* Microphone permission dialog */}
      <Dialog open={micPermissionDialog} onOpenChange={setMicPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Microphone Access Required</DialogTitle>
            <DialogDescription>
              To use voice input, you need to allow microphone access in your browser settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-medium mb-2">How to enable microphone access:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Click the lock or info icon in your browser's address bar</li>
              <li>Find "Microphone" in the site permissions</li>
              <li>Change the setting to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={() => setMicPermissionDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}