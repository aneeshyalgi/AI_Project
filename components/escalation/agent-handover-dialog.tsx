"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Video, Phone, MessageSquare } from "lucide-react"
import { getEstimatedWaitTime, saveConversationContext, type EscalationReason } from "@/lib/escalation-service"
import type { Message } from "@/types/chat"

interface AgentHandoverDialogProps {
  open: boolean
  onClose: () => void
  onContinueWithAI: () => void
  conversationId: string
  userId: string
  messages: Message[]
  reason: EscalationReason | null
}

export function AgentHandoverDialog({
  open,
  onClose,
  onContinueWithAI,
  conversationId,
  userId,
  messages,
  reason,
}: AgentHandoverDialogProps) {
  const [step, setStep] = useState<"initial" | "preferences" | "waiting" | "connected">("initial")
  const [waitTime, setWaitTime] = useState<number>(5) // Default to 5 minutes
  const [progress, setProgress] = useState(0)
  const [contactMethod, setContactMethod] = useState<"video" | "audio" | "chat">("video")
  const [agentName, setAgentName] = useState<string>("")
  const [contextSaved, setContextSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep("initial")
      setProgress(0)
    }
  }, [open])

  // Get estimated wait time when dialog opens
  useEffect(() => {
    let isMounted = true

    if (open && step === "initial" && !isLoading) {
      setIsLoading(true)

      const fetchWaitTime = async () => {
        try {
          const time = await getEstimatedWaitTime()
          if (isMounted) {
            setWaitTime(time)
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Failed to get wait time, using default")
          if (isMounted) {
            setWaitTime(5) // Default fallback
            setIsLoading(false)
          }
        }
      }

      fetchWaitTime()
    }

    return () => {
      isMounted = false
    }
  }, [open, step, isLoading])

  // Save conversation context
  useEffect(() => {
    let isMounted = true

    if (open && !contextSaved) {
      const saveContext = async () => {
        try {
          const success = await saveConversationContext(conversationId, messages, userId)
          if (isMounted) {
            setContextSaved(success)
          }
        } catch (error) {
          console.error("Error saving conversation context:", error)
        }
      }

      saveContext()
    }

    return () => {
      isMounted = false
    }
  }, [open, contextSaved, conversationId, messages, userId])

  // Simulate progress bar for waiting time
  useEffect(() => {
    if (!open || step !== "waiting") return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          // Simulate finding an agent
          setAgentName("Sarah Miller")
          setStep("connected")
          return 100
        }
        return prev + 100 / (waitTime * 60)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step, waitTime, open])

  // Get reason text
  const getReasonText = () => {
    switch (reason) {
      case "user_requested":
        return "You've requested to speak with a human agent."
      case "multiple_failures":
        return "It seems I'm having trouble understanding your request."
      case "detected_frustration":
        return "I notice this conversation might not be going as smoothly as it should."
      case "complex_issue":
        return "Your issue requires specialized assistance from one of our team members."
      case "agent_requested":
        return "One of our agents has requested to join this conversation to assist you better."
      default:
        return "We'd like to connect you with a human agent for better assistance."
    }
  }

  const handleRequestAgent = () => {
    setStep("preferences")
  }

  const handleSelectContactMethod = (method: "video" | "audio" | "chat") => {
    setContactMethod(method)
    setStep("waiting")
  }

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        {step === "initial" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect with a Human Agent</DialogTitle>
              <DialogDescription>
                {getReasonText()} Would you like to speak with a Swisscom customer service representative?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Current estimated wait time:{" "}
                <span className="font-medium">{isLoading ? "Loading..." : `${waitTime} minutes`}</span>
              </p>
              <p className="text-sm">
                A human agent will have access to your conversation history to provide better assistance.
              </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onContinueWithAI} className="sm:w-full">
                Continue with AI Assistant
              </Button>
              <Button onClick={handleRequestAgent} className="sm:w-full bg-swisscom-blue hover:bg-swisscom-blue/90">
                Connect with Agent
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preferences" && (
          <>
            <DialogHeader>
              <DialogTitle>How would you like to connect?</DialogTitle>
              <DialogDescription>
                Choose your preferred method to speak with our customer service representative.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleSelectContactMethod("video")}
              >
                <Video className="h-6 w-6 text-swisscom-blue" />
                <span>Video Call</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleSelectContactMethod("audio")}
              >
                <Phone className="h-6 w-6 text-swisscom-blue" />
                <span>Audio Call</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleSelectContactMethod("chat")}
              >
                <MessageSquare className="h-6 w-6 text-swisscom-blue" />
                <span>Text Chat</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to share your conversation history with the agent.
            </p>
          </>
        )}

        {step === "waiting" && (
          <>
            <DialogHeader>
              <DialogTitle>Finding an available agent</DialogTitle>
              <DialogDescription>
                We're connecting you with the next available customer service representative.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Estimated wait time: {Math.ceil(waitTime * (1 - progress / 100))} minutes</span>
                <span>Position in queue: 2</span>
              </div>
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-swisscom-blue" />
              </div>
              <p className="text-center text-sm">
                {contactMethod === "video" && "Please ensure your camera and microphone are ready."}
                {contactMethod === "audio" && "Please ensure your microphone is ready."}
                {contactMethod === "chat" && "You'll be notified when an agent joins the conversation."}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onContinueWithAI} className="w-full">
                Cancel and continue with AI
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "connected" && (
          <>
            <DialogHeader>
              <DialogTitle>Connected with {agentName}</DialogTitle>
              <DialogDescription>
                You're now connected with a Swisscom customer service representative.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-swisscom-blue/10 flex items-center justify-center mb-4">
                {contactMethod === "video" && <Video className="h-8 w-8 text-swisscom-blue" />}
                {contactMethod === "audio" && <Phone className="h-8 w-8 text-swisscom-blue" />}
                {contactMethod === "chat" && <MessageSquare className="h-8 w-8 text-swisscom-blue" />}
              </div>
              <p className="text-center mb-4">
                {agentName} has received your conversation history and is ready to assist you.
              </p>
              <Button className="bg-swisscom-blue hover:bg-swisscom-blue/90 w-full">
                {contactMethod === "video" && "Join Video Call"}
                {contactMethod === "audio" && "Join Audio Call"}
                {contactMethod === "chat" && "Open Chat Window"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
