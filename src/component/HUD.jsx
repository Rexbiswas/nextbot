import { useState, useEffect, useRef } from 'react'
import { Activity, Wifi, Cpu, Cloud, MapPin, Clock as ClockIcon, Eye, Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import * as faceapi from 'face-api.js'

// --- Sub-components ---

const LanguagePanel = () => {
    const { currentLang, setCurrentLang } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    // Languages list (copied from LanguageContext/UI for consistency)
    const languages = ['EN', 'ES', 'FR', 'DE']

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl space-y-3 min-w-[200px] relative">
            <h3 className="text-cyan-400 font-[Orbitron] text-xs tracking-wider border-b border-cyan-500/30 pb-1 mb-2">COMMUNICATION</h3>

            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 text-cyan-100">
                    <Globe className="text-purple-400 group-hover:rotate-12 transition-transform duration-500" size={20} />
                    <div>
                        <div className="text-xl font-bold font-[Orbitron] text-white">{currentLang}</div>
                        <div className="text-xs text-cyan-300 uppercase tracking-widest">LANGUAGE</div>
                    </div>
                </div>
                <div className={`text-cyan-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</div>
            </div>

            {/* Dropdown for Language Selection */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-black/90 border border-cyan-500/30 rounded-xl overflow-hidden z-50 shadow-lg shadow-cyan-500/20 backdrop-blur-xl">
                    {languages.map(lang => (
                        <div
                            key={lang}
                            onClick={() => {
                                setCurrentLang(lang)
                                setIsOpen(false)
                            }}
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-cyan-500/20 transition-colors ${currentLang === lang ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-gray-400'}`}
                        >
                            {lang}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const SystemStats = () => {
    const [stats, setStats] = useState({ cpu: 0, ram: 0, net: { rx: 0, tx: 0 } })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:3002/stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (e) {
                // Silent fail or mock
                // console.error(e)
            }
        }

        fetchStats()
        const interval = setInterval(fetchStats, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl space-y-3 min-w-[200px]">
            <h3 className="text-cyan-400 font-[Orbitron] text-xs tracking-wider border-b border-cyan-500/30 pb-1 mb-2">SYSTEM STATUS</h3>

            <div className="flex items-center justify-between text-cyan-100 text-sm">
                <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-blue-400" />
                    <span>CPU LOAD</span>
                </div>
                <div className="font-mono text-cyan-300">{stats.cpu}%</div>
            </div>

            <div className="flex items-center justify-between text-cyan-100 text-sm">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-green-400" />
                    <span>MEMORY</span>
                </div>
                <div className="font-mono text-cyan-300">{stats.ram}%</div>
            </div>

            <div className="flex items-center justify-between text-cyan-100 text-sm">
                <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-yellow-400" />
                    <span>NETWORK</span>
                </div>
                <div className="font-mono text-xs text-cyan-300">
                    ↓{stats.net.rx} / ↑{stats.net.tx} KB
                </div>
            </div>
        </div>
    )
}

const LocationWeather = () => {
    const [weather, setWeather] = useState({ temp: '--', condition: 'Scanning...', loc: 'Delhi, IN' })

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Delhi Coordinates: 28.61, 77.20
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current_weather=true')
                if (res.ok) {
                    const data = await res.json()
                    const t = Math.round(data.current_weather.temperature)
                    const code = data.current_weather.weathercode

                    // Simple WMO code mapping
                    let cond = 'Clear Sky'
                    if (code > 0 && code <= 3) cond = 'Partly Cloudy'
                    else if (code >= 45 && code <= 48) cond = 'Foggy'
                    else if (code >= 51 && code <= 67) cond = 'Rainy'
                    else if (code >= 71) cond = 'Snowy'
                    else if (code >= 95) cond = 'Thunderstorm'

                    setWeather({
                        temp: `${t}°C`,
                        condition: cond,
                        loc: 'Delhi, IN'
                    })
                }
            } catch (e) {
                setWeather({ temp: '--', condition: 'Offline', loc: 'Delhi, IN' })
            }
        }

        fetchWeather()
        // Refresh every 10 mins
        const interval = setInterval(fetchWeather, 600000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl space-y-3 min-w-[200px]">
            <h3 className="text-cyan-400 font-[Orbitron] text-xs tracking-wider border-b border-cyan-500/30 pb-1 mb-2">ENVIRONMENT</h3>

            <div className="flex items-center gap-3 text-cyan-100">
                <Cloud className="text-blue-400" size={20} />
                <div>
                    <div className="text-2xl font-bold font-[Orbitron] text-white">{weather.temp}</div>
                    <div className="text-xs text-cyan-300 uppercase tracking-widest">{weather.condition}</div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                <MapPin size={12} />
                <span>{weather.loc}</span>
            </div>
        </div>
    )
}

const DigitalClock = () => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl min-w-[200px] text-right">
            <h3 className="text-cyan-400 font-[Orbitron] text-xs tracking-wider border-b border-cyan-500/30 pb-1 mb-2 flex justify-end gap-2">
                <ClockIcon size={14} /> SYSTEM TIME
            </h3>
            <div className="text-3xl font-[Orbitron] text-white tracking-widest">
                {time.toLocaleTimeString([], { hour12: false })}
            </div>
            <div className="text-xs text-cyan-300 mt-1 uppercase tracking-wider">
                {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
        </div>
    )
}

const VisualInput = () => {
    const videoRef = useRef(null)
    const [active, setActive] = useState(false)
    const streamRef = useRef(null) // Keep track of stream to stop tracks

    const stopCam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setActive(false)
    }

    const startCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setActive(true)
            }
        } catch (e) {
            console.warn("Camera access denied or unavail", e)
            setActive(false)
        }
    }

    const toggleCam = () => {
        if (active) {
            stopCam()
        } else {
            startCam()
        }
    }

    useEffect(() => {
        // startCam() // Removed auto-start

        const handleShutdown = () => stopCam()
        const handleStartup = () => startCam()

        window.addEventListener('shutdown-camera', handleShutdown)
        window.addEventListener('start-camera', handleStartup)

        return () => {
            stopCam()
            window.removeEventListener('shutdown-camera', handleShutdown)
            window.removeEventListener('start-camera', handleStartup)
        }
    }, [])

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-2 rounded-xl min-w-[200px] flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 pt-1">
                <h3 className="text-cyan-400 font-[Orbitron] text-xs tracking-wider flex items-center gap-2">
                    <Eye size={14} /> VISUAL INPUT
                </h3>

                {/* Cam Toggle Button */}
                <button
                    onClick={toggleCam}
                    className={`p-1 rounded-full transition-colors ${active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600'}`}
                    title={active ? "Disable Camera" : "Enable Camera"}
                >
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                </button>
            </div>

            <div className="relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/5">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-500 ${active ? 'opacity-80' : 'opacity-0'}`}
                />

                {/* HUD Overlay Lines on Video (Only Visible when Active) */}
                {active && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cyan-500/50"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-cyan-500/50"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-cyan-500/50"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cyan-500/50"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <div className="w-10 h-10 border border-cyan-500 rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}

                {!active && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-mono">
                        OFFLINE
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Main HUD Component ---

const HUD = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-40 p-6 flex justify-between items-start">
            {/* Left Panel */}
            <div className="flex flex-col gap-4 mt-20 md:mt-0 animate-in slide-in-from-left duration-700 fade-in pointer-events-auto">
                <SystemStats />
                <LocationWeather />
                <LanguagePanel />
            </div>

            {/* Right Panel */}
            <div className="flex flex-col gap-4 mt-20 md:mt-0 animate-in slide-in-from-right duration-700 fade-in pointer-events-auto">
                <DigitalClock />
                <VisualInput />
            </div>
        </div>
    )
}

export default HUD
