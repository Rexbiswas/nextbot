import React, { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Particle Sphere Component
const ParticleSphere = () => {
    const pointsRef = useRef()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [targetScale, setTargetScale] = useState(1)

    // Listen to speaking events
    useEffect(() => {
        const handleSpeakStart = () => {
            setIsSpeaking(true)
            setTargetScale(1.1)
        }
        const handleSpeakEnd = () => {
            setIsSpeaking(false)
            setTargetScale(1)
        }

        window.addEventListener('bot-speaking-start', handleSpeakStart)
        window.addEventListener('bot-speaking-end', handleSpeakEnd)
        return () => {
            window.removeEventListener('bot-speaking-start', handleSpeakStart)
            window.removeEventListener('bot-speaking-end', handleSpeakEnd)
        }
    }, [])

    // Generate points on a sphere
    const count = 2000
    const particlesPosition = useMemo(() => {
        const temp = new Float32Array(count * 3)
        const phi = Math.PI * (3 - Math.sqrt(5))
        const radius = 2.5

        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2
            const r = Math.sqrt(1 - y * y)
            const theta = phi * i

            const x = Math.cos(theta) * r
            const z = Math.sin(theta) * r

            temp[i * 3] = x * radius
            temp[i * 3 + 1] = y * radius
            temp[i * 3 + 2] = z * radius
        }
        return temp
    }, [])

    useFrame((state) => {
        if (!pointsRef.current) return

        const { clock, pointer, camera } = state
        const time = clock.getElapsedTime()

        // Rotate
        const speed = isSpeaking ? 0.2 : 0.05
        pointsRef.current.rotation.y += speed * 0.01

        // Pulse (Scale)
        pointsRef.current.scale.x += (targetScale - pointsRef.current.scale.x) * 0.1
        pointsRef.current.scale.y += (targetScale - pointsRef.current.scale.y) * 0.1
        pointsRef.current.scale.z += (targetScale - pointsRef.current.scale.z) * 0.1

        // Mouse Interaction
        // Convert pointer (screen space) to 3D ray
        // This is a simplified "screen plane" interaction for performance
        const positions = pointsRef.current.geometry.attributes.position.array

        // We need a vector to calculate cursor position in world space
        // We project the mouse vector to z=0 plane roughly
        const cursor = new THREE.Vector3(pointer.x * 5, pointer.y * 5, 0)

        // Get the mesh's world rotation to counteract it for local checks if needed,
        // but simple distance check on raw positions works well enough for "chaos" effect.

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Original Positions
            const ox = particlesPosition[i3]
            const oy = particlesPosition[i3 + 1]
            const oz = particlesPosition[i3 + 2]

            // Current Positions
            let px = positions[i3]
            let py = positions[i3 + 1]
            let pz = positions[i3 + 2]

            // Vector from particle to cursor (approximate)
            // Since the sphere rotates, "local" x/y/z aren't world aligned.
            // But let's add a "turbulence" effect near the mouse.

            // Just noise movement
            // px = ox + Math.sin(time + ox * 10) * 0.05

            // Interactive Repulsion/Attraction
            // To do this cheaply without raycasting every point: 
            // We just use the 'pointer' values directly as a "localized disturbance"
            // We can treat the sphere as if it's static for the interaction check to simplify math

            const dx = (pointer.x * 4) - ox
            const dy = (pointer.y * 4) - oy
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 1.0) {
                // Repel
                const force = (1.0 - dist) * 2 // Strength
                const angle = Math.atan2(dy, dx)

                // Push away from mouse
                const tx = ox - Math.cos(angle) * force
                const ty = oy - Math.sin(angle) * force

                // Interpolate current pos to target pos
                px += (tx - px) * 0.1
                py += (ty - py) * 0.1
            } else {
                // Return to original with some sine wave drift
                const drift = Math.sin(time + i) * 0.02
                px += (ox + drift - px) * 0.1
                py += (oy + drift - py) * 0.1
                pz += (oz + drift - pz) * 0.1
            }

            positions[i3] = px
            positions[i3 + 1] = py
            positions[i3 + 2] = pz
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.025}
                color={isSpeaking ? "#00FFFF" : "#06b6d4"}
                transparent
                opacity={0.8}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </points>
    )
}

const ParticlesBackground = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#000000' }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true, alpha: true }}>
                <ambientLight intensity={0.5} />
                <ParticleSphere />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    )
}

export default ParticlesBackground
