"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Float, ContactShadows } from "@react-three/drei"
import { useRef, Suspense, useState, useEffect, useMemo, Component, ReactNode } from "react"
import * as THREE from "three"

class VisualizationErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// Lightweight floating shards — plain material, no transmission
function ActionShards() {
  const shards = useMemo(() => Array.from({ length: 8 }), [])
  return (
    <group>
      {shards.map((_, i) => (
        <Float key={i} speed={1.5 + i * 0.2} rotationIntensity={1.5} floatIntensity={0.8}>
          <mesh position={[(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 8, -8 - i * 0.5]}>
            <tetrahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#3b82f6" opacity={0.15} transparent />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function DialogueWaveform({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null)
  const prevMouse = useRef({ x: 0, y: 0 })
  const intensity = useRef(0)

  useFrame((state) => {
    if (groupRef.current) {
      const dx = mouse.x - prevMouse.current.x
      const dy = mouse.y - prevMouse.current.y
      const currentSpeed = Math.sqrt(dx * dx + dy * dy)
      intensity.current = THREE.MathUtils.lerp(intensity.current, currentSpeed * 15, 0.1)
      prevMouse.current = { ...mouse }

      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const t = state.clock.elapsedTime * 1.5 + i * 0.5
          const baseScale = 0.2 + Math.sin(t) * 0.1
          child.scale.y = baseScale + intensity.current * 0.4
        }
      })
    }
  })

  const bars = useMemo(() => Array.from({ length: 12 }), [])

  return (
    <group ref={groupRef} position={[0, -1, -4]}>
      {bars.map((_, i) => (
        <mesh key={i} position={[(i - 5.5) * 0.8, 0, 0]}>
          <boxGeometry args={[0.05, 4, 0.05]} />
          <meshStandardMaterial color="#3b82f6" opacity={0.25} transparent />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ mouse }: { mouse: { x: number; y: number } }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[-10, -5, 10]} intensity={1.5} color="#1e40af" />
      <DialogueWaveform mouse={mouse} />
      <ActionShards />
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.15}
        scale={18}
        blur={2}
        far={3}
        resolution={128}
      />
    </>
  )
}

export function HeroScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      })
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,_white_0%,_#f8fafc_100%)]">
      <VisualizationErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 40 }}
          dpr={[1, 1]}
          frameloop="demand"
          gl={{ antialias: false, powerPreference: "low-power" }}
        >
          <Suspense fallback={null}>
            <Scene mouse={mouse} />
          </Suspense>
        </Canvas>
      </VisualizationErrorBoundary>
    </div>
  )
}
