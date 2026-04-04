"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshTransmissionMaterial, Environment, ContactShadows } from "@react-three/drei"
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
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <p className="text-sm font-medium">Visualization not supported on this device</p>
          <p className="mt-1 text-xs opacity-60">Try updating your browser or simplifying your workspace.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function ActionShards() {
  const shards = useMemo(() => Array.from({ length: 15 }), [])
  return (
    <group>
      {shards.map((_, i) => (
        <Float key={i} speed={2 + Math.random() * 2} rotationIntensity={2} floatIntensity={1}>
          <mesh position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, -8 - Math.random() * 5]}>
            <tetrahedronGeometry args={[0.1, 0]} />
            <MeshTransmissionMaterial 
              transmission={0.8} 
              roughness={0.1} 
              thickness={0.02} 
              color="#ffffff" 
              opacity={0.2} 
              transparent 
              chromaticAberration={0.01}
            />
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
    <group ref={groupRef} position={[0, -1, -4]}>
      {bars.map((_, i) => (
        <mesh key={i} position={[(i - 5.5) * 0.8, 0, 0]}>
          <boxGeometry args={[0.05, 4, 0.05]} />
          <MeshTransmissionMaterial 
            transmission={0.9} 
            roughness={0.2} 
            thickness={0.05} 
            color="#3b82f6" 
            opacity={0.3} 
            transparent 
            chromaticAberration={0.02}
          />
        </mesh>
      ))}
    </group>
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
      
      <DialogueWaveform mouse={mouse} />
      <ActionShards />
      
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.2}
        scale={20}
        blur={1.5}
        far={3.0}
        resolution={256}
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
      <VisualizationErrorBoundary>
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <Scene mouse={mouse} />
          </Suspense>
        </Canvas>
      </VisualizationErrorBoundary>
    </div>
  )
}
