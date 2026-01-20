import React from "react"
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from "./contexts/AuthContext"
import { LanguageProvider } from "./contexts/LanguageContext"
import Ui from './component/ui.jsx'
import AssistantModal from "./component/assistantModal.jsx"
import "./tailwind-setup.css"
import "./index.css"


import ParticlesBackground from "./component/ParticlesBackground.jsx"
import StartOverlay from "./component/StartOverlay.jsx"

import HUD from "./component/HUD.jsx"

export default function App() {
  return (
    <div className="app">
      <ParticlesBackground />
      <LanguageProvider>
        <AuthProvider>
          <StartOverlay />
          <HUD />
          <Ui />
          <AssistantModal />
        </AuthProvider>
      </LanguageProvider>
    </div>
  )
}
