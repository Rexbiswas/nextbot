import { useState } from 'react'

function Navbar() {

  return (
    <>
      {/* nextbot-navbar */}
      <nav className="p-10">
        <div className='nav-bar-container flex justify-between items-center max-w-7xl mx-auto'>
          <div className="w-10"></div>

          <div className="navbar-title">
            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 font-[Orbitron]">NEXTBOT</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </nav>
      <main>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openAssistantModal'))}
          className="absolute z-50 bottom-5 right-5 px-8 py-3 rounded-full border border-cyan-500/20 bg-cyan-500/20 backdrop-blur-md hover:bg-cyan-500/40 transition-all duration-300 text-white group shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          Let's Talk
        </button>
      </main>
    </>
  )
}

export default Navbar