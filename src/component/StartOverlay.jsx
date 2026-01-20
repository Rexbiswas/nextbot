import { useState } from 'react'
import FaceAuth from './FaceAuth'

const StartOverlay = () => {
    const [visible, setVisible] = useState(true)
    const [showFaceAuth, setShowFaceAuth] = useState(false)

    const handleStart = () => {
        setVisible(false)
        // Dispatch event to start the assistant
        window.dispatchEvent(new CustomEvent('start-nextbot'))
    }

    if (!visible) return null

    return (
        <div className="start-overlay-container fixed inset-0 z-10000 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl transition-opacity duration-700"
            style={{ opacity: visible ? 1 : 0 }}
        >

            <div className="text-center space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
                </div>

                <h1 className="start-title text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 font-[Orbitron] tracking-widest">
                    NEXTBOT
                </h1>

                <p className="start-subtitle text-gray-400 text-lg tracking-wide">
                    System Initialized. Awaiting Input.
                </p>

                <div className="relative flex flex-col items-center">
                    {!showFaceAuth ? (
                        <button
                            onClick={() => setShowFaceAuth(true)}
                            className="start-btn group relative px-8 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                        >
                            <span className="text-cyan-300 font-bold tracking-wider text-xl">AUTHENTICATE</span>
                            <div className="absolute inset-0 rounded-full ring-2 ring-cyan-500/30 group-hover:ring-cyan-500/60 animate-ping opacity-20"></div>
                        </button>
                    ) : (
                        <div className="animate-in zoom-in duration-300">
                            <FaceAuth onAuthenticated={handleStart} mode="login" />
                            <div className="mt-4">
                                <button
                                    onClick={handleStart}
                                    className="text-xs text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                                >
                                    [ Manual Override ]
                                </button>
                            </div>  
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Decoration */}
            <div className="start-footer absolute bottom-10 text-xs text-gray-600 font-mono">
                SECURE CONNECTION ESTABLISHED
            </div>
        </div>
    )
}

export default StartOverlay
