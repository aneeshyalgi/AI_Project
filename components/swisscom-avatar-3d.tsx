"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import type * as THREE from "three"

// Avatar model component
function AvatarModel({
  mood,
  isSpeaking,
}: {
  mood: "neutral" | "happy" | "thinking"
  isSpeaking: boolean
}) {
  // In a real implementation, we would load a GLTF model
  // For this example, we'll create a more detailed 3D head
  const headRef = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const eyebrowLeftRef = useRef<THREE.Mesh>(null)
  const eyebrowRightRef = useRef<THREE.Mesh>(null)
  const [mouthOpen, setMouthOpen] = useState(0)
  const [blinkTime, setBlinkTime] = useState(0)

  // Set up blinking
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlinkTime(Date.now())
      },
      Math.random() * 3000 + 2000,
    ) // Random blink between 2-5 seconds

    return () => clearInterval(blinkInterval)
  }, [])

  // Animate the mouth when speaking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setMouthOpen(Math.random() * 0.5)
      }, 150)
      return () => clearInterval(interval)
    } else {
      setMouthOpen(0)
    }
  }, [isSpeaking])

  // Subtle head movement and expressions
  useFrame((state) => {
    if (headRef.current) {
      // Base movement
      headRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1
      headRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05 + 0.1

      // Add mood-specific movements
      if (mood === "happy") {
        headRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.03
      } else if (mood === "thinking") {
        headRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05
        headRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.08
      }
    }

    if (mouthRef.current) {
      mouthRef.current.scale.y = 1 + mouthOpen

      // Mouth shape based on mood
      if (mood === "happy" && !isSpeaking) {
        mouthRef.current.scale.x = 1.2
        mouthRef.current.scale.y = 0.8
        mouthRef.current.position.y = -0.32
      } else if (!isSpeaking) {
        mouthRef.current.scale.x = 1
        mouthRef.current.position.y = -0.3
      }
    }

    // Eyebrow animations based on mood
    if (eyebrowLeftRef.current && eyebrowRightRef.current) {
      if (mood === "happy") {
        eyebrowLeftRef.current.rotation.z = 0.2
        eyebrowRightRef.current.rotation.z = -0.2
        eyebrowLeftRef.current.position.y = 0.35
        eyebrowRightRef.current.position.y = 0.35
      } else if (mood === "thinking") {
        eyebrowLeftRef.current.rotation.z = -0.3
        eyebrowRightRef.current.rotation.z = 0.1
        eyebrowLeftRef.current.position.y = 0.32
        eyebrowRightRef.current.position.y = 0.38
      } else {
        eyebrowLeftRef.current.rotation.z = 0
        eyebrowRightRef.current.rotation.z = 0
        eyebrowLeftRef.current.position.y = 0.33
        eyebrowRightRef.current.position.y = 0.33
      }
    }
  })

  // Blinking effect
  const eyeScale = useRef({ x: 1, y: 1 })
  useFrame(() => {
    const timeSinceLastBlink = Date.now() - blinkTime
    if (timeSinceLastBlink < 150) {
      // Blink animation
      const blinkPhase = timeSinceLastBlink / 150
      eyeScale.current.y = blinkPhase < 0.5 ? 1 - blinkPhase * 2 : (blinkPhase - 0.5) * 2
    } else {
      eyeScale.current.y = 1
    }
  })

  return (
    <group ref={headRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#f0d0b5" /> {/* Slightly warmer skin tone */}
      </mesh>

      {/* Hair */}
      <group position={[0, 0.4, 0]}>
        {/* Top hair */}
        <mesh position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.9, 0.4, 0.9]} />
          <meshStandardMaterial color="#2a2a2a" /> {/* Dark hair color */}
        </mesh>

        {/* Front quiff */}
        <mesh position={[0, 0.5, 0.4]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.8, 0.3, 0.4]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Side hair left */}
        <mesh position={[-0.5, 0, 0.2]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Side hair right */}
        <mesh position={[0.5, 0, 0.2]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>

      {/* Eyes */}
      <group position={[-0.3, 0.2, 0.85]} scale={[1, eyeScale.current.y, 1]}>
        <mesh>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial color="#5e3e19" /> {/* Brown eyes */}
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.03, 32, 32]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>

      <group position={[0.3, 0.2, 0.85]} scale={[1, eyeScale.current.y, 1]}>
        <mesh>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshStandardMaterial color="#5e3e19" /> {/* Brown eyes */}
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <sphereGeometry args={[0.03, 32, 32]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>

      {/* Glasses */}
      <group position={[0, 0.2, 0.9]}>
        {/* Left lens */}
        <mesh position={[-0.3, 0, 0]}>
          <ringGeometry args={[0.13, 0.16, 32]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[-0.3, 0, 0]}>
          <circleGeometry args={[0.13, 32]} />
          <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} />
        </mesh>

        {/* Right lens */}
        <mesh position={[0.3, 0, 0]}>
          <ringGeometry args={[0.13, 0.16, 32]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[0.3, 0, 0]}>
          <circleGeometry args={[0.13, 32]} />
          <meshStandardMaterial color="#e0e0e0" transparent opacity={0.2} />
        </mesh>

        {/* Bridge */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.03, 0.03]} />
          <meshStandardMaterial color="#444444" />
        </mesh>

        {/* Temple arms */}
        <mesh position={[-0.45, 0, -0.05]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[0.45, 0, -0.05]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh position={[-0.3, 0.33, 0.95]} rotation={[0, 0, 0]} ref={eyebrowLeftRef}>
        <boxGeometry args={[0.2, 0.03, 0.02]} />
        <meshStandardMaterial color="#2a2a2a" /> {/* Match hair color */}
      </mesh>

      <mesh position={[0.3, 0.33, 0.95]} rotation={[0, 0, 0]} ref={eyebrowRightRef}>
        <boxGeometry args={[0.2, 0.03, 0.02]} />
        <meshStandardMaterial color="#2a2a2a" /> {/* Match hair color */}
      </mesh>

      {/* Mouth */}
      <group position={[0, -0.3, 0.85]}>
        {/* Mouth background (for open mouth) */}
        <mesh position={[0, 0, 0]} scale={[1, mouthOpen > 0 ? mouthOpen + 0.5 : 0.5, 0.1]}>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color="#701010" /> {/* Dark red inside mouth */}
        </mesh>

        {/* Lips */}
        <mesh position={[0, 0, 0.05]} ref={mouthRef}>
          <boxGeometry args={[0.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#d08080" /> {/* Lip color */}
        </mesh>
      </group>

      {/* Nose */}
      <mesh position={[0, 0, 1]}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#e0c0a0" /> {/* Slightly darker than face */}
      </mesh>

      {/* Ears */}
      <mesh position={[-0.9, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[0.15, 32, 16]} />
        <meshStandardMaterial color="#f0d0b5" />
      </mesh>
      <mesh position={[0.9, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <sphereGeometry args={[0.15, 32, 16]} />
        <meshStandardMaterial color="#f0d0b5" />
      </mesh>

      {/* Swisscom logo on forehead - made smaller and more subtle */}
      <mesh position={[0, 0.7, 0.5]} rotation={[0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
        <planeGeometry args={[0.6, 0.2]} />
        <meshStandardMaterial color="#0000ff" opacity={0.7} transparent />
      </mesh>
    </group>
  )
}

// Background component
function Background() {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1a1a" /> {/* Darker background to match the image */}
    </mesh>
  )
}

export function SwisscomAvatar3D({
  mood = "neutral",
  isSpeaking,
}: {
  mood?: "neutral" | "happy" | "thinking"
  isSpeaking: boolean
}) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[0, 5, 5]} intensity={0.8} angle={0.5} penumbra={1} castShadow />
        <AvatarModel mood={mood} isSpeaking={isSpeaking} />
        <Background />
        <Environment preset="studio" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.5}
          minAzimuthAngle={-0.5}
          maxAzimuthAngle={0.5}
        />
      </Canvas>
    </div>
  )
}
