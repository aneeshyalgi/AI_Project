"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, useAnimations, Environment } from "@react-three/drei"
import type * as THREE from "three"
import { getCurrentMouthOpenness, isLipSyncActive } from "@/lib/text-to-speech"

// GLTF avatar w/ lip‑sync & mood
function GLTFAvatar({
  mood,
  isSpeaking,
  modelPath = "/assets/3d/avatar2.glb",
}: {
  mood: "neutral" | "happy" | "thinking"
  isSpeaking: boolean
  modelPath?: string
}) {
  const { scene, animations } = useGLTF(modelPath)
  const { mixer } = useAnimations(animations, scene)
  const model = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [mouthOpen, setMouthOpen] = useState(0)

  // Point camera at mid‑torso
  useEffect(() => {
    camera.lookAt(0, 0.5, 0)
  }, [camera])

  useFrame(() => {
    if (!model.current) return

    // subtle body sway
    model.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.05

    // lip‑sync or fallback
    if (isSpeaking) {
      setMouthOpen(isLipSyncActive() ? getCurrentMouthOpenness() : Math.random() * 0.5)
    } else {
      setMouthOpen(0)
    }

    // push mouth scale
    model.current.traverse((child) => {
      if (child.name?.toLowerCase().includes("mouth")) {
        ;(child as THREE.Mesh).scale.y = 1 + mouthOpen
      }
    })
  })

  return (
    <group
      ref={model}
      // lifted so feet + legs + torso + head are in frame
      position={[0, -0.5, 0]}
      rotation={[0, Math.PI, 0]}
      scale={[1, 1, 1]}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload("/assets/3d/avatar26.glb")

export function AdvancedAvatar({
  mood = "neutral",
  isSpeaking,
}: {
  mood?: "neutral" | "happy" | "thinking"
  isSpeaking: boolean
}) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Canvas
        shadows
        // camera lifted & pulled back
        camera={{ position: [0, 1.2, 3], fov: 50 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={1024} />
        <GLTFAvatar mood={mood} isSpeaking={isSpeaking} />
        <Environment preset="city" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.5}
          minAzimuthAngle={-0.5}
          maxAzimuthAngle={0.5}
          // aim at mid‑torso/head
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  )
}
