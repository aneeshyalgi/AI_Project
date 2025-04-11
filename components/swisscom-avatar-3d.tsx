"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import type * as THREE from "three"

interface SwisscomAvatar3DProps {
  isSpeaking: boolean
  messages: { role: string; content: string }[]
}

function Avatar({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<THREE.Group>(null)
  const [mouthScale, setMouthScale] = useState(0.1)

  // Animate the avatar based on speaking state
  useFrame((state) => {
    if (!group.current) return

    // Simple breathing animation
    group.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.05

    // If speaking, animate the mouth
    if (isSpeaking) {
      const newScale = 0.1 + Math.abs(Math.sin(state.clock.getElapsedTime() * 10)) * 0.2
      setMouthScale(newScale)
    } else {
      setMouthScale(0.1)
    }
  })

  return (
    <group ref={group}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#0066CC" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 0.2, 0.7]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.3, 0.2, 0.7]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Pupils */}
      <mesh position={[-0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Mouth - changes when speaking */}
      <mesh position={[0, -0.2, 0.7]} scale={[0.5, mouthScale, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Swisscom branding elements */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#0066CC" />
      </mesh>
    </group>
  )
}

export default function SwisscomAvatar3D({ isSpeaking, messages }: SwisscomAvatar3DProps) {
  const [currentEmotion, setCurrentEmotion] = useState("neutral")

  // Analyze last message to determine emotion
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") return

    const content = lastMessage.content.toLowerCase()

    if (content.includes("sorry") || content.includes("apologize") || content.includes("unfortunately")) {
      setCurrentEmotion("sad")
    } else if (content.includes("great") || content.includes("excellent") || content.includes("happy")) {
      setCurrentEmotion("happy")
    } else {
      setCurrentEmotion("neutral")
    }
  }, [messages])

  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <Avatar isSpeaking={isSpeaking} />
    </Canvas>
  )
}

