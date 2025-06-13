"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { LipSyncAvatar } from "@/components/LipSyncAvatar"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { Environment } from "@react-three/drei"
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  checkMicrophoneAccess,
} from "@/lib/speech-recognition"
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from "@/lib/text-to-speech"

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return size
}

export function CustomerServiceAvatar({ userId }: { userId: string }) {
  const recognition = useRef<SpeechRecognition | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { width, height } = useWindowSize()

  // Remove this variable calculation
  // const avatarScale =
  //   width < 640
  //     ? 1.6
  //     : width < 1024
  //       ? 2.4
  //       : 3.6

  const startListening = useCallback(() => {
    if (!recognition.current) return
    try {
      recognition.current.start()
      setIsListening(true)
    } catch {
      // already running or unsupported
    }
  }, [])

  const processQuery = async (userText: string) => {
    setIsLoading(true)
    stopSpeaking()
    setIsSpeaking(false)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId,
          messages: [{ role: "user", content: userText }],
          settings: { model: "gpt-4o", temperature: 0.7 },
        }),
      })
      const convHdr = res.headers.get("X-Conversation-Id")
      if (convHdr) setConversationId(convHdr)
      if (!res.ok) throw new Error(`API error ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assistantText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        let boundary: number
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          if (chunk.startsWith("data: ")) {
            const data = chunk.slice(6).trim()
            if (data === "[DONE]") {
              buffer = ""
              break
            }
            try {
              const { text } = JSON.parse(data)
              assistantText += text
            } catch {}
          }
        }
      }

      if (isSpeechSynthesisSupported()) {
        setIsSpeaking(true)
        speakText(assistantText, () => {
          setIsSpeaking(false)
          startListening()
        })
      } else {
        setTimeout(() => startListening(), 500)
      }
    } catch (err) {
      console.error("Chat error:", err)
      setTimeout(() => startListening(), 500)
    } finally {
      setIsLoading(false)
      setIsListening(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    if (typeof window === "undefined") return
    if (!isSpeechRecognitionSupported()) return

    checkMicrophoneAccess().then((status) => {
      if (status.permission === "prompt") requestMicrophonePermission()
    })

    const rec = createSpeechRecognition()
    recognition.current = rec

    if (rec) {
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("")
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false)
          processQuery(transcript)
        }
      }
      rec.onend = () => {
        if (!isSpeaking && !isLoading) startListening()
      }
      rec.onerror = () => {
        setIsListening(false)
        setTimeout(() => startListening(), 500)
      }
    }

    startListening()
    return () => {
      if (rec) rec.abort()
    }
  }, [startListening, isSpeaking, isLoading])

  if (!isMounted) return null

  return (
    <Canvas
      camera={{ position: [0, 0.5, 1.0], fov: 35 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.8
        gl.outputColorSpace = THREE.LinearSRGBColorSpace
      }}
      className="fixed inset-0 w-screen h-screen z-50"
      style={{
      position: "absolute",
      top: "64px",        // start just below the header
      left: 0,
      width: "100vw",
      height: "calc(100vh - 64px)",
      background: "transparent"
       }}
      >
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 5, 1]} intensity={0.7} />
      <Environment preset="studio" background={false} />

      {/* Wrap avatar in a group to apply responsive scale */}
      <group scale={[0.3, 0.3, 0.3]} position={[0, 0, 0]}>
        <LipSyncAvatar modelPath="/assets/3d/avatar26.glb" isSpeaking={isSpeaking} />
      </group>
    </Canvas>
  )
}
