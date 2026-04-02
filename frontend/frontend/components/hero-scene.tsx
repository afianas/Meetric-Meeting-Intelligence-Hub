"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshTransmissionMaterial, Environment, Sphere, ContactShadows, Box, Torus, Icosahedron } from "@react-three/drei"
import { useRef, Suspense, useState, useEffect, useMemo } from "react"
import * as THREE from "three"

function InsightCrystal({ mouse, scale = 0.7, color = "#ffffff", speed = 0.05 }: { 
  mouse: { x: number; y: number }; 
  scale?: number; 
  color?: string; 
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pos = useRef(new THREE.Vector3(2, 0, 0))
  const vel = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state) => {
    if (meshRef.current) {
      // 1. Attraction to mouse
      const targetX = mouse.x * 4.5
      const targetY = mouse.y * 2.5
      
      const accX = (targetX - pos.current.x) * speed
      const accY = (targetY - pos.current.y) * speed
      
      vel.current.x += accX
      vel.current.y += accY
      
      // 2. Friction
      vel.current.multiplyScalar(0.92)
      
      // 3. Edge Bouncing
      const boundsX = 5.5
      const boundsY = 3.2
      
      if (Math.abs(pos.current.x + vel.current.x) > boundsX) {
        vel.current.x *= -0.8
      }
      if (Math.abs(pos.current.y + vel.current.y) > boundsY) {
        vel.current.y *= -0.8
      }
      
      // 4. Update Position
      pos.current.add(vel.current)
      meshRef.current.position.copy(pos.current)
      
      // 5. High-end Rotation
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      // Subtle wobble based on velocity
      meshRef.current.scale.setScalar(scale + vel.current.length() * 0.2)
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1, 0]}>
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={512}
          transmission={1}
          roughness={0.05}
          thickness={0.8}
          ior={1.5}
          chromaticAberration={0.2}
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.05}
          color={color}
        />
      </Icosahedron>
    </Float>
  )
}

function DialogueWaveform({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null)
  const prevMouse = useRef({ x: 0, y: 0 })
  const intensity = useRef(0)

  useFrame((state) => {
    if (groupRef.current) {
      // Calculate mouse movement intensity (speed)
      const dx = mouse.x - prevMouse.current.x
      const dy = mouse.y - prevMouse.current.y
      const currentSpeed = Math.sqrt(dx * dx + dy * dy)
      
      intensity.current = THREE.MathUtils.lerp(intensity.current, currentSpeed * 20, 0.1)
      prevMouse.current = { ...mouse }

      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const t = state.clock.elapsedTime * 2 + i * 0.5
          const baseScale = 0.2 + Math.sin(t) * 0.1
          const scaleY = baseScale + intensity.current * (0.5 + Math.random() * 0.5)
          child.scale.set(1, scaleY, 1)
          
          // Subtle glow shift
          const material = child.material as any
          if (material && "thickness" in material) {
            material.thickness = 0.1 + intensity.current * 0.2
          }
        }
      })
    }
  })

  const bars = useMemo(() => Array.from({ length: 12 }), [])

  return (
    <group ref={groupRef} position={[0, -2, -4]}>
      {bars.map((_, i) => (
        <mesh key={i} position={[(i - 5.5) * 0.8, 0, 0]}>
          <boxGeometry args={[0.05, 4, 0.05]} />
          <MeshTransmissionMaterial 
            transmission={1} 
            roughness={0.1} 
            thickness={0.1} 
            color="#3b82f6" 
            opacity={0.3} 
            transparent 
          />
        </mesh>
      ))}
    </group>
  )
}

function ActionShards() {
  const shards = useMemo(() => Array.from({ length: 15 }), [])
  return (
    <group>
      {shards.map((_, i) => (
        <Float key={i} speed={2 + Math.random() * 2} rotationIntensity={2} floatIntensity={1}>
          <mesh position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, -8 - Math.random() * 5]}>
            <tetrahedronGeometry args={[0.1, 0]} />
            <MeshTransmissionMaterial transmission={1} roughness={0} thickness={0.05} color="#ffffff" opacity={0.2} transparent />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function FloatingAlignmentRing() {
  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={1}>
       <Torus args={[3, 0.01, 16, 100]} position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
          <MeshTransmissionMaterial transmission={1} roughness={0} thickness={0.1} color="#ffffff" opacity={0.2} transparent />
       </Torus>
    </Float>
  )
}

function FloatingBriefings() {
  return (
    <>
      <Float speed={1.4} rotationIntensity={1} floatIntensity={1.5}>
         <Box args={[0.8, 1.2, 0.05]} position={[-4, -1, -2]}>
            <MeshTransmissionMaterial transmission={0.95} roughness={0.05} thickness={0.1} color="#60a5fa" opacity={0.2} transparent />
         </Box>
      </Float>
      <Float speed={1.1} rotationIntensity={0.8} floatIntensity={2}>
         <Box args={[1.5, 0.8, 0.05]} position={[5, 2, -5]} rotation={[0.4, -0.4, 0.2]}>
            <MeshTransmissionMaterial transmission={0.95} roughness={0.1} thickness={0.1} color="#1e40af" opacity={0.15} transparent />
         </Box>
      </Float>
    </>
  )
}

function Scene({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <pointLight position={[-10, -5, 10]} intensity={2} color="#1e40af" />
      <pointLight position={[5, 5, 5]} intensity={1} color="#60a5fa" />
      
      <InsightCrystal mouse={mouse} />
      <DialogueWaveform mouse={mouse} />
      <ActionShards />
      <FloatingBriefings />
      <FloatingAlignmentRing />
      
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.2}
        scale={20}
        blur={2.5}
        far={4.5}
      />
    </>
  )
}

export function HeroScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse coordinates to -1 to 1
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,_white_0%,_#f8fafc_100%)]">
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <Suspense fallback={null}>
          <Scene mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  )
}
