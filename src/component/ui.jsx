import { useState } from 'react'
import { motion } from 'framer-motion'

function Navbar() {

  return (
    <>
      {/* nextbot-navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="p-4 md:p-10 fixed top-0 w-full z-50 pointer-events-none"
      >
        <div className='nav-bar-container flex justify-between items-center max-w-7xl mx-auto'>
          <div className="w-10"></div>

          <div className="navbar-title pointer-events-auto">
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 font-[Orbitron]">NEXTBOT</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </motion.nav>
      <main>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
          whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(6,182,212,0.6)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('openAssistantModal'))}
          className="absolute z-50 bottom-5 right-5 px-8 py-3 rounded-full border border-cyan-500/20 bg-cyan-500/20 backdrop-blur-md text-white group shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden font-[Orbitron] tracking-wider"
        >
          <span className="relative z-10">Let's Talk</span>
          <div className="absolute inset-0 bg-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </motion.button>
      </main>
    </>
  )
}

export default Navbar