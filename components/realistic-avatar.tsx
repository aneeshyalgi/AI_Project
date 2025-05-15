"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import type * as THREE from "three"
import { getCurrentMouthOpenness, isLipSyncActive } from "@/lib/text-to-speech"

function AvatarModel({
  mood,
  isSpeaking,
}: {
  mood: "neutral" | "happy" | "thinking"
  isSpeaking: boolean
}) {
  const { scene } = useGLTF("/assets/3d/avatar.glb") as any
  const group = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [mouthOpen, setMouthOpen] = useState(0)

  // lock camera onto torso
  useEffect(() => {
    camera.lookAt(0, 0.5, 0)
  }, [camera])

  // clone so we don’t mutate the original GLTF
  useEffect(() => {
    if (modelRef.current && scene) {
      modelRef.current.clear()
      modelRef.current.add(scene.clone())
    }
  }, [scene])

  useFrame(() => {
    if (!group.current) return

    // gentle sway
    group.current.rotation.y = Math.sin(Date.now() * 0.0003) * 0.05

    // lip‑sync mouth
    if (isSpeaking) {
      setMouthOpen(isLipSyncActive() ? getCurrentMouthOpenness() : Math.random() * 0.5)
    } else {
      setMouthOpen(0)
    }

    // mood‑based head tilt & mouth
    modelRef.current?.traverse((child: any) => {
      const name = (child.name || "").toLowerCase()
      if (name.includes("head") || name.includes("face") || name.includes("skull")) {
        if (mood === "happy") {
          child.rotation.z = Math.sin(Date.now() * 0.0005) * 0.05
          child.rotation.x = Math.sin(Date.now() * 0.0003) * 0.05 + 0.05
        } else if (mood === "thinking") {
          child.rotation.z = Math.sin(Date.now() * 0.0002) * 0.1
          child.rotation.x = Math.sin(Date.now() * 0.0003) * 0.05 + 0.1
        } else {
          child.rotation.z = Math.sin(Date.now() * 0.0002) * 0.02
          child.rotation.x = Math.sin(Date.now() * 0.0003) * 0.02
        }
      }
      if (name.includes("mouth")) {
        child.scale.y = 1 + mouthOpen
      }
    })
  })

  return (
    <group
      ref={group}
      // lift so the full figure is in view
      position={[0, -0.5, 0]}
      rotation={[0, Math.PI, 0]}
      scale={[1, 1, 1]}
    >
      <group ref={modelRef} />
    </group>
  )
}

useGLTF.preload("/assets/3d/avatar.glb")

export function RealisticAvatar({
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
        // pulled back & raised
        camera={{ position: [0, 1.2, 3], fov: 50 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={1024} />
        <AvatarModel mood={mood} isSpeaking={isSpeaking} />
        <Environment preset="city" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.5}
          minAzimuthAngle={-0.5}
          maxAzimuthAngle={0.5}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  )
}
