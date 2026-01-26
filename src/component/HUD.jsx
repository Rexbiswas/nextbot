import { useState, useEffect } from 'react'
import { Activity, Wifi, Cpu, Cloud, MapPin, Mic } from 'lucide-react'

import { motion } from 'framer-motion'

// --- Style Utilities ---


const SciFiPanel = ({ children, className = '', title, type = 'normal', onClick }) => {
    const clipStyle = type === 'reverse'
        ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
        : "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"

    return (
        <div className={`relative group ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            {/* Outer Glow/Border Container */}
            <div
                className="absolute inset-0 bg-cyan-500/20 transition-all duration-300 group-hover:bg-cyan-400/40"
                style={{ clipPath: clipStyle }}
            >
            </div>

            {/* Inner Content Container - slightly smaller to create border effect */}
            <div
                className="absolute inset-[1px] bg-black/80 backdrop-blur-xl flex flex-col p-3 sm:p-4 shadow-inner shadow-cyan-900/50"
                style={{ clipPath: clipStyle }}
            >
                {/* Decorative header line */}
                {title && (
                    <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
                        <h3 className="text-cyan-400 font-[Orbitron] text-[10px] sm:text-xs tracking-[0.2em] flex items-center gap-2">
                            {title}
                        </h3>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-cyan-500/30 rounded-full"></div>
                        </div>
                    </div>
                )}

                {children}

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500 opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500 opacity-50"></div>
            </div>
        </div>
    )
}

// --- Sub-components ---



const SystemStats = () => {
    const [stats, setStats] = useState({ cpu: 42, ram: 38, net: { rx: 120, tx: 45 } })

    // Simulating updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                cpu: Math.floor(Math.random() * 20) + 30,
                ram: Math.floor(Math.random() * 10) + 40,
                net: { rx: Math.floor(Math.random() * 500), tx: Math.floor(Math.random() * 500) }
            })
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <SciFiPanel title="SYSTEM STATUS" className="w-[150px] h-[120px] sm:w-[220px] sm:h-[145px] md:w-[240px] md:h-[160px]">
                <div className="space-y-1.5 sm:space-y-2 md:space-y-3 mt-0.5 sm:mt-1">
                    {/* CPU Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] md:text-[10px] text-cyan-300 font-[Orbitron]">
                            <span className="flex items-center gap-1"><Cpu size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" /> CPU</span>
                            <span>{stats.cpu}%</span>
                        </div>
                        <div className="h-1 md:h-1.5 w-full bg-cyan-900/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-linear-to-r from-blue-500 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.cpu}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* RAM Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[8px] md:text-[10px] text-cyan-300 font-[Orbitron]">
                            <span className="flex items-center gap-1"><Activity size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" /> MEM</span>
                            <span>{stats.ram}%</span>
                        </div>
                        <div className="h-1 md:h-1.5 w-full bg-cyan-900/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-linear-to-r from-green-500 to-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.ram}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Network */}
                    <div className="pt-2 border-t border-cyan-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[8px] md:text-[10px] text-gray-400 font-mono">
                        <div className="flex items-center gap-1 text-yellow-400 mb-1 sm:mb-0"><Wifi size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" /> NET</div>
                        <div className="text-[7px] md:text-[9px]">RX:{stats.net.rx} TX:{stats.net.tx}</div>
                    </div>
                </div>
            </SciFiPanel>
        </motion.div>
    )
}

const LocationWeather = () => {
    const [weather, setWeather] = useState({ temp: '--°C', condition: 'SCANNING', loc: 'LOCATING...' })

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Parallel Fetch: Weather (Open-Meteo) & Location (BigDataCloud) - Both Free/No-Key
                    const [weatherRes, locRes] = await Promise.all([
                        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`),
                        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    ]);

                    const weatherData = await weatherRes.json();
                    const locData = await locRes.json();

                    // Map WMO Weather Code
                    const wmo = weatherData.current_weather.weathercode;
                    let condition = 'CLEAR';
                    if (wmo > 0) condition = 'CLOUDY';
                    if (wmo >= 45) condition = 'FOG';
                    if (wmo >= 51) condition = 'DRIZZLE';
                    if (wmo >= 61) condition = 'RAIN';
                    if (wmo >= 71) condition = 'SNOW';
                    if (wmo >= 95) condition = 'STORM';

                    // Format Location
                    let locationName = locData.city || locData.locality || locData.principalSubdivision || 'UNKNOWN';
                    if (locData.countryCode) locationName += `, ${locData.countryCode}`;

                    setWeather({
                        temp: `${Math.round(weatherData.current_weather.temperature)}°C`,
                        condition: condition,
                        loc: locationName.toUpperCase()
                    });

                } catch (e) {
                    console.error("Weather/Loc Error", e);
                    setWeather(prev => ({ ...prev, condition: 'OFFLINE' }));
                }
            }, (error) => {
                console.error("GPS Error", error);
                setWeather(prev => ({ ...prev, loc: 'GPS DISABLED' }));
            });
        } else {
            setWeather(prev => ({ ...prev, loc: 'NO GPS' }));
        }
    }, [])

    return (
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <SciFiPanel title="ENVIRONMENT" className="w-[150px] h-[90px] sm:w-[220px] sm:h-[105px] md:w-[240px] md:h-[110px]">
                <div className="flex items-center gap-2 md:gap-4 h-full">
                    <div className="p-2 md:p-3 bg-blue-500/10 rounded-full border border-blue-500/30 shrink-0">
                        <Cloud className="text-blue-400 w-4 h-4 md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl md:text-3xl font-bold font-[Orbitron] text-white leading-none">{weather.temp}</div>
                        <div className="text-[8px] md:text-[10px] text-cyan-500 tracking-wider mt-1 font-[Orbitron] truncate">{weather.condition}</div>
                        <div className="text-[8px] md:text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1 truncate"><MapPin size={8} className="w-2 h-2 md:w-2.5 md:h-2.5" /> {weather.loc}</div>
                    </div>
                </div>
            </SciFiPanel>
        </motion.div>
    )
}

const DigitalClock = () => {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <SciFiPanel title="SYSTEM TIME" type="reverse" className="w-[150px] h-[75px] sm:w-[220px] sm:h-[90px] md:w-[240px] md:h-[100px]">
                <div className="flex flex-col items-end justify-center h-full">
                    <div className="text-xl sm:text-2xl md:text-3xl font-[Orbitron] text-white tracking-widest font-bold tabular-nums">
                        {time.toLocaleTimeString([], { hour12: false })}
                    </div>
                    <div className="text-[8px] md:text-xs text-cyan-400 font-[Orbitron] tracking-[0.2em] mt-1">
                        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                </div>
            </SciFiPanel>
        </motion.div>
    )
}



const LetsTalkButton = () => {
    const [hover, setHover] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    useEffect(() => {
        const handleSpeakStart = () => setIsSpeaking(true)
        const handleSpeakEnd = () => setIsSpeaking(false)

        window.addEventListener('bot-speaking-start', handleSpeakStart)
        window.addEventListener('bot-speaking-end', handleSpeakEnd)
        return () => {
            window.removeEventListener('bot-speaking-start', handleSpeakStart)
            window.removeEventListener('bot-speaking-end', handleSpeakEnd)
        }
    }, [])

    const handleInteraction = () => {
        // Dispatch event to open the assistant modal
        window.dispatchEvent(new Event('openAssistantModal'))
    }

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-5 sm:bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto z-50"
        >
            <button
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={handleInteraction}
                className="relative group bg-transparent focus:outline-none"
            >
                {/* Button Base - Complex Polygon */}
                <div
                    className={`relative w-56 h-14 sm:w-64 sm:h-16 backdrop-blur-xl border flex items-center justify-center overflow-hidden transition-all duration-300 ${isSpeaking
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                        : 'bg-black/60 border-cyan-500/50 group-hover:bg-cyan-500/10 group-hover:border-cyan-400'
                        }`}
                    style={{ clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)" }}
                >
                    <div className="flex items-center gap-3 relative z-10">
                        {isSpeaking ? (
                            <div className="flex gap-1 h-6 items-center">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [4, 16, 4] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1 bg-cyan-300 rounded-full"
                                    />
                                ))}
                            </div>
                        ) : (
                            <Mic className={`transition-colors duration-300 ${hover ? 'text-white' : 'text-cyan-400'}`} size={24} />
                        )}

                        <span className={`font-[Orbitron] text-lg font-bold tracking-[0.2em] transition-colors duration-300 ${hover ? 'text-white' : 'text-cyan-300'}`}>
                            {isSpeaking ? 'SYSTEM ACTIVE' : "LET'S TALK"}
                        </span>
                    </div>

                    {/* Animated Glint */}
                    <div className="absolute inset-0 w-[200%] h-full bg-linear-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-[150%] skew-x-12" style={{ animation: (hover || isSpeaking) ? 'shine 1.5s infinite linear' : 'none' }}></div>
                </div>

                {/* Decorative Side Wings */}
                <div className="absolute top-0 -left-4 w-4 h-full bg-cyan-900/20 border-l border-b border-cyan-500/30 transition-all duration-300 group-hover:-translate-x-1" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}></div>
                <div className="absolute top-0 -right-4 w-4 h-full bg-cyan-900/20 border-r border-b border-cyan-500/30 transition-all duration-300 group-hover:translate-x-1" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}></div>
            </button>


        </motion.div>
    )
}

// --- Main HUD Layout ---

const HUD = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-40 p-2 sm:p-4 font-sans text-white select-none overflow-hidden">
            {/* Top Left Stack */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-4">
                <SystemStats />
                <LocationWeather />

            </div >

            {/* Top Right Stack */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex flex-col gap-4 items-end">
                <DigitalClock />
            </div>

            {/* Bottom Center */}
            <LetsTalkButton />

            {/* Background Grid Lines (Decorative) */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-0 left-[20%] w-[1px] h-full bg-cyan-500"></div>
                <div className="absolute top-0 right-[20%] w-[1px] h-full bg-cyan-500"></div>
                <div className="absolute top-[50%] left-0 w-full h-[1px] bg-cyan-500"></div>
            </div>
        </div>
    )
}

export default HUD
