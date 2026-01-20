import { useState, useEffect, useRef } from 'react'
import { useAssistant } from '../hooks/useAssistant'
import { motion, AnimatePresence } from 'framer-motion'
import { isMobile } from 'react-device-detect'
import { Mic, Send, X, Trash2 } from 'lucide-react'
import '../styles/assistantModal.css'

function AssistantModal() {
  const [isActive, setIsActive] = useState(false)

  const {
    messages,
    inputValue,
    setInputValue,
    handleSubmit,
    handleMicClick,
    handleClearChat,
    isListening,
    error,
    initializeAssistant
  } = useAssistant()

  const chatContainerRef = useRef(null)

  useEffect(() => {
    const handleStart = () => initializeAssistant()
    window.addEventListener('start-nextbot', handleStart)
    return () => window.removeEventListener('start-nextbot', handleStart)
  }, [initializeAssistant])

  useEffect(() => {
    const handleOpenModal = () => setIsActive(true)
    window.addEventListener('openAssistantModal', handleOpenModal)
    return () => window.removeEventListener('openAssistantModal', handleOpenModal)
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      y: isMobile ? '100%' : 20,
      scale: isMobile ? 1 : 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: {
      opacity: 0,
      y: isMobile ? '100%' : 20,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 10, x: -10 },
    visible: { opacity: 1, y: 0, x: 0 },
  }

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-100 flex items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsActive(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
                pointer-events-auto
                relative bg-black/80 border border-cyan-500/30 
                flex flex-col overflow-hidden
                shadow-[0_0_50px_rgba(6,182,212,0.15)]
                ${isMobile
                ? 'w-full h-full rounded-none'
                : 'w-[500px] h-[600px] rounded-2xl'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-cyan-900/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="font-[Orbitron] text-cyan-400 tracking-widest text-lg">NEXTBOT</h2>
              </div>
              <button
                onClick={() => setIsActive(false)}
                className="text-cyan-500/50 hover:text-cyan-400 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-cyan-500/30 text-center px-8">
                  <div className="text-4xl mb-4 opacity-20 font-[Orbitron]">AI</div>
                  <p className="font-light">Ready to assist.</p>
                  {isMobile && <p className="text-xs mt-2">Tap microphone to speak</p>}
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className={`flex ${msg.who === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                            max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                            ${msg.who === 'user'
                      ? 'bg-cyan-500/20 text-cyan-50 rounded-tr-sm border border-cyan-500/20'
                      : 'bg-gray-800/50 text-gray-200 rounded-tl-sm border border-white/5'
                    }
                            ${msg.typing ? 'animate-pulse' : ''}
                        `}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs px-4 py-2 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-cyan-500/20">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                className="flex gap-2 items-center"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMicClick}
                  className={`
                            p-3 rounded-full transition-all duration-300
                            ${isListening
                      ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    }
                        `}
                >
                  <Mic size={20} />
                </motion.button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 bg-gray-900/50 border border-cyan-500/30 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.9 }}
                  disabled={!inputValue.trim()}
                  className="p-3 bg-cyan-500/20 text-cyan-400 rounded-full hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} />
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClearChat}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={16} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AssistantModal