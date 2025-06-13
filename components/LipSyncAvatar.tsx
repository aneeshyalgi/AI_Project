// src/components/LipSyncAvatar.tsx
"use client"

import React, { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF, useAnimations, Environment, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import {
  isLipSyncActive,
  getCurrentMouthOpenness,
} from "@/lib/text-to-speech"

type Props = {
  modelPath?: string      // e.g. "/assets/3d/avatar26.glb"
  isSpeaking: boolean     // toggled true/false around your speakText() calls
}

export function LipSyncAvatar({
  modelPath = "/assets/3d/avatar26.glb",
  isSpeaking,
}: Props) {
  const group = useRef<THREE.Group>(null)

  // Load scene + any baked-in animations
  const { scene, animations } = useGLTF(modelPath)
  const { actions, names } = useAnimations(animations, group)

  // Find all meshes with mouth/jaw blendshapes for lip-sync
  const [mouthTargets, setMouthTargets] = useState<
    { mesh: THREE.Mesh; morphIndex: number }[]
  >([])

  // If there's a baked “Idle” clip, we'll play it
  const [idleAction, setIdleAction] = useState<THREE.AnimationAction | null>(null)

  // A ref to hold our “smoothed” mouth openness
  const smoothedOpennessRef = useRef(0)

  useEffect(() => {
    // 1) Cache all "open/jaw/mouth" morph targets
    const targets: { mesh: THREE.Mesh; morphIndex: number }[] = []
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary) {
        Object.keys(child.morphTargetDictionary).forEach((key) => {
          if (/open|jaw|mouth/i.test(key)) {
            const idx = child.morphTargetDictionary[key]
            targets.push({ mesh: child, morphIndex: idx })
          }
        })
      }
    })
    setMouthTargets(targets)

    // 2) Play a baked Idle animation if available
    if (names.length > 0) {
      const idleName = names.find((n) => /idle/i.test(n)) || names[0]
      const action = actions[idleName]
      if (action) {
        action.reset()
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
        setIdleAction(action)
      }
    }
  }, [scene, animations, actions, names])

  // Clock for procedural fallback motion if no baked idleAction
  const clockRef = useRef(0)

  useFrame((_, delta) => {
    clockRef.current += delta

    // --- 1) Get raw openness from TTS each frame ---
    const rawOpenness =
      isSpeaking && isLipSyncActive()
        ? getCurrentMouthOpenness()
        : 0

    // --- 2) Smooth it: lerp towards rawOpenness ---
    // Change 0.1 to a smaller number (e.g. 0.05) to slow it more
    smoothedOpennessRef.current +=
      (rawOpenness - smoothedOpennessRef.current) * 0.1

    // --- 3) Apply smoothed openness to all morph targets ---
    mouthTargets.forEach(({ mesh, morphIndex }) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[morphIndex] = smoothedOpennessRef.current
      }
    })

    // --- 4) Procedural fallback idle if no baked clip ---
    if (!idleAction && group.current) {
      // subtle breathing bob:
      const yOffset = Math.sin(clockRef.current * 1.2) * 0.02
      group.current.position.y = -1 + yOffset

      // subtle head sway (replace "Head" if your GLB names differ)
      const headBone = scene.getObjectByName("Head") as THREE.Object3D | null
      if (headBone) {
        headBone.rotation.y = Math.sin(clockRef.current * 0.5) * 0.1
      }

      // subtle arm sway (replace "LeftArm"/"RightArm" if needed)
      const leftArm = scene.getObjectByName("LeftArm") as THREE.Object3D | null
      if (leftArm) {
        leftArm.rotation.z = Math.sin(clockRef.current * 0.7) * 0.1
      }
      const rightArm = scene.getObjectByName("RightArm") as THREE.Object3D | null
      if (rightArm) {
        rightArm.rotation.z = -Math.sin(clockRef.current * 0.7) * 0.1
      }
    }
  })

  return (
    <group
      ref={group}
      position={[0, -1, 0]}      // lower avatar by 1 unit
      rotation={[0, Math.PI, 0]}  // flip so it faces forward
    >
      <primitive object={scene} />
      {/* OrbitControls so you can click‐drag to rotate */}
      <OrbitControls enableZoom={false} />
      {/* Optional: environment lighting */}
      <Environment preset="studio" background={false} />
    </group>
  )
}
