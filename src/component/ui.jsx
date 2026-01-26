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
    </>
  )
}

export default Navbar