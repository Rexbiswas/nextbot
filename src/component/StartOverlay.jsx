import { useState } from 'react'
import FaceAuth from './FaceAuth'
import { motion, AnimatePresence } from 'framer-motion'

const StartOverlay = () => {
    const [visible, setVisible] = useState(true)
    const [showFaceAuth, setShowFaceAuth] = useState(false)

    const handleStart = () => {
        // Delay slightly for effect or just fade out immediately
        setVisible(false)
        // Dispatch event to start the assistant after a slight delay matching animation?
        // Actually, dispatch immediately so background starts up while overlay fades
        window.dispatchEvent(new CustomEvent('start-nextbot'))
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="start-overlay-container fixed inset-0 z-1000 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-4"
                >
                    <div className="text-center space-y-6 md:space-y-10">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
                        </div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="start-title text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 font-[Orbitron] tracking-widest"
                        >
                            NEXTBOT
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="start-subtitle text-gray-400 text-base md:text-lg tracking-wide"
                        >
                            System Initialized. Awaiting Input.
                        </motion.p>

                        <div className="relative flex flex-col items-center">
                            {!showFaceAuth ? (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.3)" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowFaceAuth(true)}
                                    className="start-btn group relative px-6 py-3 md:px-8 md:py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-full transition-all duration-300"
                                >
                                    <span className="text-cyan-300 font-bold tracking-wider text-lg md:text-xl">AUTHENTICATE</span>
                                    <div className="absolute inset-0 rounded-full ring-2 ring-cyan-500/30 group-hover:ring-cyan-500/60 animate-ping opacity-20"></div>
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <FaceAuth onAuthenticated={handleStart} mode="login" />
                                    <div className="mt-4">
                                        <button
                                            onClick={handleStart}
                                            className="text-xs text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                                        >
                                            [ Manual Override ]
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Visual Decoration */}
                    <div className="start-footer absolute bottom-10 text-xs text-gray-600 font-mono">
                        SECURE CONNECTION ESTABLISHED
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default StartOverlay
