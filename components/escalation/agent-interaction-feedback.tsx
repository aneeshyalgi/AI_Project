"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

interface AgentInteractionFeedbackProps {
  open: boolean
  onClose: () => void
  conversationId: string
  agentName: string
}

export function AgentInteractionFeedback({ open, onClose, conversationId, agentName }: AgentInteractionFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    // In a real app, you would send this data to your backend
    console.log("Feedback submitted:", {
      conversationId,
      agentName,
      rating,
      feedback,
    })

    setSubmitted(true)

    // Close after a short delay
    setTimeout(() => {
      onClose()
      // Reset form for next time
      setRating(null)
      setFeedback("")
      setSubmitted(false)
    }, 1500)
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
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>How was your experience?</DialogTitle>
              <DialogDescription>
                Please rate your interaction with {agentName}. Your feedback helps us improve our service.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>How would you rate your experience?</Label>
                <div className="flex justify-center py-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`mx-1 p-1 rounded-full transition-all ${
                        rating && value <= rating
                          ? "text-yellow-400 transform scale-110"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-resolved">Was your issue resolved?</Label>
                <RadioGroup defaultValue="yes" className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="issue-resolved-yes" />
                    <Label htmlFor="issue-resolved-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partially" id="issue-resolved-partially" />
                    <Label htmlFor="issue-resolved-partially">Partially</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="issue-resolved-no" />
                    <Label htmlFor="issue-resolved-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Additional comments (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us more about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Skip
              </Button>
              <Button onClick={handleSubmit} disabled={!rating} className="bg-swisscom-blue hover:bg-swisscom-blue/90">
                Submit Feedback
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium">Thank you for your feedback!</h3>
            <p className="text-sm text-gray-500">Your input helps us improve our service.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
