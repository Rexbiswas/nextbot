import { useEffect, useRef } from 'react'

const ParticlesBackground = () => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        let animationFrameId
        let rotation = 0


        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        handleResize()
        window.addEventListener('resize', handleResize)

        // Config
        const particleCount = 400
        const globeRadius = Math.min(350, window.innerWidth < 600 ? window.innerWidth * 0.4 : 350)
        const connectionDistance = 60
        const focalLength = 600


        const particles = []


        const phi = Math.PI * (3 - Math.sqrt(5))

        for (let i = 0; i < particleCount; i++) {
            const y = 1 - (i / (particleCount - 1)) * 2
            const radius = Math.sqrt(1 - y * y)
            const theta = phi * i

            const x = Math.cos(theta) * radius
            const z = Math.sin(theta) * radius

            particles.push({
                x: x * globeRadius,
                y: y * globeRadius,
                z: z * globeRadius,
                initialX: x * globeRadius,
                initialY: y * globeRadius,
                initialZ: z * globeRadius
            })
        }

        // Mouse State
        let mouseX = 0
        let mouseY = 0
        let targetRotationX = 0
        let targetRotationY = 0

        const handleMouseMove = (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1
            mouseY = (e.clientY / window.innerHeight) * 2 - 1
        }
        window.addEventListener('mousemove', handleMouseMove)

        // State for visualization
        let isSpeaking = false
        const handleSpeakStart = () => { isSpeaking = true }
        const handleSpeakEnd = () => { isSpeaking = false }

        window.addEventListener('bot-speaking-start', handleSpeakStart)
        window.addEventListener('bot-speaking-end', handleSpeakEnd)

        let currentRotationY = 0
        let currentTiltX = 0.2

        const renderLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2

            // Logic overrides
            const baseSpeed = isSpeaking ? 0.015 : 0.002

            // Interpolate values
            currentRotationY += baseSpeed + (mouseX * 0.01)
            const targetTilt = mouseY * 1.5
            currentTiltX += (targetTilt - currentTiltX) * 0.05

            const projectedParticles = []

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                const rotY_X = p.initialX * Math.cos(currentRotationY) - p.initialZ * Math.sin(currentRotationY)
                const rotY_Z = p.initialX * Math.sin(currentRotationY) + p.initialZ * Math.cos(currentRotationY)
                const rotX_Y = p.initialY * Math.cos(currentTiltX) - rotY_Z * Math.sin(currentTiltX)
                const rotX_Z = p.initialY * Math.sin(currentTiltX) + rotY_Z * Math.cos(currentTiltX)
                const scale = focalLength / (focalLength + rotX_Z + 200)
                const x2d = rotY_X * scale + centerX
                const y2d = rotX_Y * scale + centerY

                projectedParticles.push({ x: x2d, y: y2d, z: rotX_Z, scale })

                const alpha = Math.max(0.1, (scale - 0.5) * 1.5)
                // Color shift: Cyan normally, brighter when speaking
                const color = isSpeaking ? `rgba(100, 255, 255, ${alpha})` : `rgba(6, 182, 212, ${alpha})`

                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(x2d, y2d, (isSpeaking ? 2 : 1.5) * scale, 0, Math.PI * 2)
                ctx.fill()
            }

            ctx.lineWidth = isSpeaking ? 1 : 0.5
            for (let i = 0; i < projectedParticles.length; i++) {
                const p1 = projectedParticles[i]
                const checkLimit = Math.min(projectedParticles.length, i + 30)

                for (let j = i + 1; j < checkLimit; j++) {
                    const p2 = projectedParticles[j]
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < connectionDistance * p1.scale) {
                        const alpha = Math.min(1, (1 - dist / (connectionDistance * p1.scale))) * 0.3 * p1.scale
                        if (alpha > 0.05) {
                            ctx.strokeStyle = isSpeaking ? `rgba(100, 255, 255, ${alpha})` : `rgba(6, 182, 212, ${alpha})`
                            ctx.beginPath()
                            ctx.moveTo(p1.x, p1.y)
                            ctx.lineTo(p2.x, p2.y)
                            ctx.stroke()
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(renderLoop)
        }
        renderLoop()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('bot-speaking-start', handleSpeakStart)
            window.removeEventListener('bot-speaking-end', handleSpeakEnd)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: -1,
                background: 'linear-gradient(to bottom, #1a1a1a 0%, #000000 100%)',
                height: '100vh',
                width: '100vw',
                pointerEvents: 'none',
            }}
        />
    )
}

export default ParticlesBackground
