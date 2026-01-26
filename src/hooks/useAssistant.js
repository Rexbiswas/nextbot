import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext'
import { isMobile, osName, osVersion, browserName, isBrowser, isAndroid, isIOS, isWindows, isMacOs } from 'react-device-detect'

// --- System Detection ---
const getSystemProfile = () => {
  return {
    os: osName || 'Unknown OS',
    version: osVersion || 'Unknown Version',
    browser: browserName || 'Unknown Browser',
    isMobile,
    isDesktop: !isMobile,
    platform: isAndroid ? 'Android' : isIOS ? 'iOS' : isWindows ? 'Windows' : isMacOs ? 'macOS' : 'Linux/Other',
    capabilities: {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      camera: !!navigator.mediaDevices?.getUserMedia,
      bluetooth: !!navigator.bluetooth
    }
  }
}

// --- AI Service (Mock/Bridge) ---
const interpretCommandWithAI = async (text, profile) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  // 1. AI Implementation
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are NextBot, a specialized system assistant. 
              System Profile: ${JSON.stringify(profile)}.
              Determine the user's INTENT from the following categories:
              - OPEN_APP (params: appName)
              - SYSTEM_CONTROL (params: action, target)
              - SEARCH (params: query)
              - REMINDER (params: text, timeInMs)
              - CHAT (params: response)
              
              Rules:
              - If Mobile: support opening [whatsapp, instagram, maps, camera, settings].
              - If Desktop: support [notepad, excel, word, terminal, settings].
              - If command is unsupported on this OS, allow CHAT intent explaining why.
              
              Return ONLY raw JSON.`
            },
            { role: "user", content: text }
          ]
        })
      })
      const data = await response.json()
      if (data.choices?.[0]?.message?.content) {
        return JSON.parse(data.choices[0].message.content)
      }
    } catch (e) {
      console.warn("AI Fallback:", e)
    }
  }

  // 2. Smart Regex Fallback (If no API key or error)
  const lower = text.toLowerCase()

  // Mobile Apps
  if (profile.isMobile) {
    if (lower.includes('whatsapp')) return { type: 'OPEN_APP', params: { appName: 'whatsapp' } }
    if (lower.includes('instagram')) return { type: 'OPEN_APP', params: { appName: 'instagram' } }
    if (lower.includes('camera')) return { type: 'OPEN_APP', params: { appName: 'camera' } }
  }
  // Desktop Apps
  else {
    if (lower.includes('notepad')) return { type: 'OPEN_APP', params: { appName: 'notepad' } }
    if (lower.includes('excel')) return { type: 'OPEN_APP', params: { appName: 'excel' } }
    if (lower.includes('word')) return { type: 'OPEN_APP', params: { appName: 'word' } }
  }

  // Common
  if (lower.includes('time')) return { type: 'TIME' }
  if (lower.includes('search') || lower.includes('google')) {
    return { type: 'SEARCH', params: { query: text.replace(/search|google|for/gi, '').trim() } }
  }

  return { type: 'CHAT', params: { response: null } } // Default fallback
}

const NEXTBOT = {
  name: 'nextbot',
  rate: 0.95,
  pitch: 0.9,
  volume: 1,

  // Multilingual content
  content: {
    EN: {
      voice: 'en-US',
      greetings: [
        "Hello! I'm nextbot. How can I help you today?",
        "Hey there! nextbot here, ready to assist.",
        "Greetings! I'm nextbot. What can I do for you?",
        "nextbot online. How may I be of service?",
        "Hi! This is nextbot. How can I assist you today?"
      ],
      acknowledgements: ["Got it!", "Done!", "Sure thing!", "Alright!"],
      errors: ["I'm sorry, I didn't understand that.", "Could you rephrase that?"]
    },
    ES: {
      voice: 'es-ES',
      greetings: [
        "¡Hola! Soy nextbot. ¿Cómo puedo ayudarte hoy?",
        "¡Hola! Aquí nextbot, listo para ayudar.",
        "¡Saludos! Soy nextbot. ¿Qué puedo hacer por ti?",
        "nextbot en línea. ¿Cómo puedo servirle?",
        "¡Hola! Soy nextbot. ¿En qué puedo ayudarte?"
      ],
      acknowledgements: ["¡Entendido!", "¡Hecho!", "¡Claro!", "¡Muy bien!"],
      errors: ["Lo siento, no entendí eso.", "¿Podrías reformularlo?"]
    },
    FR: {
      voice: 'fr-FR',
      greetings: [
        "Bonjour! Je suis nextbot. Comment puis-je vous aider?",
        "Salut! nextbot à votre service.",
        "Salutations! Je suis nextbot. Que puis-je faire pour vous?"
      ],
      acknowledgements: ["Compris!", "C'est fait!", "Bien sûr!", "D'accord!"],
      errors: ["Je suis désolé, je n'ai pas compris.", "Pourriez-vous reformuler?"]
    },
    DE: {
      voice: 'de-DE',
      greetings: [
        "Hallo! Ich bin nextbot. Wie kann ich helfen?",
        "Hallo! nextbot hier, bereit zu helfen.",
        "Grüße! Ich bin nextbot. Was kann ich für Sie tun?"
      ],
      acknowledgements: ["Verstanden!", "Erledigt!", "Aber sicher!", "In Ordnung!"],
      errors: ["Es tut mir leid, das habe ich nicht verstanden.", "Könnten Sie das umformulieren?"]
    }
  }
}

const REM_KEY = 'nextbot_reminders'
const TODO_KEY = 'nextbot_todos'

export function useAssistant() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const scheduledTimeouts = useRef({})
  const { getCurrentUser } = useAuth()
  const { currentLang } = useLanguage()

  // Get content based on language
  const content = NEXTBOT.content[currentLang] || NEXTBOT.content['EN']

  // --- Persistence Helpers ---
  const loadReminders = () => {
    try { return JSON.parse(localStorage.getItem(REM_KEY) || '[]'); }
    catch { return []; }
  }
  const saveReminders = (arr) => localStorage.setItem(REM_KEY, JSON.stringify(arr))

  const loadTodos = () => {
    try { return JSON.parse(localStorage.getItem(TODO_KEY) || '[]'); }
    catch { return []; }
  }
  const saveTodos = (arr) => localStorage.setItem(TODO_KEY, JSON.stringify(arr))

  // --- Speech & Output ---
  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window)) return

    // Ensure voices are loaded
    const synth = window.speechSynthesis
    let voices = synth.getVoices()

    const speakNow = () => {
      synth.cancel()
      const ut = new SpeechSynthesisUtterance(text)

      // User settings overrides
      const user = getCurrentUser()
      const settings = user?.settings || {}


      ut.rate = options.rate || settings.voiceRate || NEXTBOT.rate
      ut.pitch = options.pitch || settings.voicePitch || NEXTBOT.pitch
      ut.volume = options.volume || settings.voiceVolume || NEXTBOT.volume

      // Use Global Language
      const targetLangCode = LANGUAGES[currentLang]?.code || 'en-US'
      ut.lang = options.lang || settings.language || targetLangCode

      // Try to get custom voice, prioritize language match
      let preferred = null
      if (settings.preferredVoice) {
        preferred = voices.find(v => v.name === settings.preferredVoice)
      }
      if (!preferred) {
        // Find a voice that matches the language
        preferred = voices.find(v => v.lang.startsWith(targetLangCode.split('-')[0]))
      }
      if (preferred) ut.voice = preferred

      ut.onstart = () => window.dispatchEvent(new CustomEvent('bot-speaking-start'))
      ut.onend = () => window.dispatchEvent(new CustomEvent('bot-speaking-end'))
      ut.onerror = () => window.dispatchEvent(new CustomEvent('bot-speaking-end'))

      synth.speak(ut)
    }

    if (voices.length === 0) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices()
        speakNow()
        synth.onvoiceschanged = null
      }
    } else {
      speakNow()
    }

  }, [getCurrentUser, currentLang])

  const addMessage = useCallback((text, who = 'bot', typing = false) => {
    setMessages(prev => [...prev, { text, who, typing }])
  }, [])

  const scheduleReminder = useCallback((reminder) => {
    const id = reminder.id
    const ms = reminder.time - Date.now()

    if (ms <= 0) return

    if (scheduledTimeouts.current[id]) clearTimeout(scheduledTimeouts.current[id])

    scheduledTimeouts.current[id] = setTimeout(() => {
      speak(`Reminder: ${reminder.text}`)
      addMessage(`Reminder: ${reminder.text}`, 'bot')

      const current = loadReminders()
      const updated = current.filter(r => r.id !== id)
      saveReminders(updated)

      delete scheduledTimeouts.current[id]
    }, ms)
  }, [speak, addMessage])

  useEffect(() => {
    const rems = loadReminders()
    rems.forEach(r => scheduleReminder(r))
    const timeouts = scheduledTimeouts.current

    return () => {
      Object.values(timeouts).forEach(t => clearTimeout(t))
    }
  }, [scheduleReminder])
  /* 
     --- Process Command (Next-Gen AI & System Aware) --- 
  */
  const processCommand = useCallback(async (text) => {
    const rawText = text
    text = text.trim()
    addMessage(rawText, 'user')

    const system = getSystemProfile()

    // Quick Local Filters (Latency Optimization)
    // 1. Greetings
    if (/^(hi|hello|hey|good morning|hola|bonjour)/i.test(text)) {
      const greeting = content.greetings[Math.floor(Math.random() * content.greetings.length)]
      speak(greeting)
      addMessage(greeting, 'bot', true)
      return
    }

    // 2. AI / Smart Interpretation
    let intent = { type: 'processing' }
    try {
      intent = await interpretCommandWithAI(text, system)
    } catch (e) {
      intent = { type: 'CHAT', params: { response: null } }
    }

    // 3. Execution Engine
    switch (intent.type) {
      case 'OPEN_APP':
        handleAppOpen(intent.params.appName, system)
        break;

      case 'SEARCH':
        const searchResp = `Searching for ${intent.params.query}...`
        speak(searchResp)
        addMessage(searchResp, 'bot', true)
        setTimeout(() => window.open(`https://www.google.com/search?q=${encodeURIComponent(intent.params.query)}`, '_blank'), 1000)
        break;

      case 'TIME':
        const now = new Date()
        const timeResp = `It's currently ${now.toLocaleTimeString()}.`
        speak(timeResp)
        addMessage(timeResp, 'bot', true)
        break;

      case 'SYSTEM_CONTROL':
        // Handle camera/etc
        if (intent.params.target === 'camera') {
          // Logic to dispatch event
        }
        break;

      case 'CHAT':
      default:
        // If AI gave a specific response, use it
        if (intent.params?.start_camera) { // Fallback regex check inside switch if AI fails
          // ...
        }

        // Fallback or AI Chat Response
        let responseText = intent.params?.response

        if (!responseText) {
          // Local fallback logic for basic commands if AI didn't return response
          if (/(shut down|turn off) (camera|visual)/i.test(text)) {
            window.dispatchEvent(new CustomEvent('shutdown-camera'))
            responseText = "Visual sensors disabled."
          } else if (/(turn on|enable) (camera|visual)/i.test(text)) {
            window.dispatchEvent(new CustomEvent('start-camera'))
            responseText = "Visual sensors enabled."
          } else {
            responseText = content.errors[Math.floor(Math.random() * content.errors.length)]
          }
        }

        speak(responseText)
        addMessage(responseText, 'bot', true)
        break;
    }

  }, [speak, addMessage, content])

  // Helper: App Launching Logic
  const handleAppOpen = (appName, system) => {
    appName = appName.toLowerCase()

    let msg = `Opening ${appName}...`
    let url = null

    // Mobile Handling
    if (system.isMobile) {
      const schemes = {
        whatsapp: 'whatsapp://',
        instagram: 'instagram://',
        twitter: 'twitter://',
        facebook: 'fb://',
        youtube: 'youtube://',
        settings: 'app-settings:',
        camera: 'camera:', // Generic attempt
        mail: 'mailto:',
        maps: 'maps://'
      }
      // Fuzzy match
      const key = Object.keys(schemes).find(k => appName.includes(k))
      if (key) url = schemes[key]
    }
    // Desktop Handling
    else {
      // Desktop Bridge (Localhost)
      try {
        fetch('http://localhost:3002/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: appName })
        }).catch(() => {
          addMessage("Desktop bridge unavailable. Ensure server is running.", 'bot')
        })
        msg = `Attempting to launch ${appName} on ${system.os}...`
        speak(msg)
        addMessage(msg, 'bot', true)
        return // Bridge handles it
      } catch (e) { }
    }

    if (url) {
      speak(msg)
      addMessage(msg, 'bot', true)
      window.location.href = url
    } else if (system.isMobile) {
      // Fallback for mobile
      const searchMsg = `I can't launch ${appName} directly. Searching Store...`
      speak(searchMsg)
      addMessage(searchMsg, 'bot', true)
      setTimeout(() => window.open(`https://play.google.com/store/search?q=${appName}`, '_blank'), 1500)
    } else {
      // Desktop Web Fallback
      const webMsg = `Launching web version of ${appName}...`
      speak(webMsg)
      addMessage(webMsg, 'bot', true)
      // Simple map for web versions
      if (appName.includes('word')) window.open('https://office.live.com/start/Word.aspx')
      else if (appName.includes('excel')) window.open('https://office.live.com/start/Excel.aspx')
      else window.open(`https://www.google.com/search?q=${appName}`, '_blank')
    }
  }

  // --- Recognition Setup ---
  // Use a ref to track if we *should* be listening, to handle auto-restart
  const shouldListenRef = useRef(true)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true // Enable continuous listening
    recognition.interimResults = false
    recognition.lang = LANGUAGES[currentLang]?.code || 'en-US'

    recognition.onresult = (event) => {
      // Get the last result
      const lastResultIndex = event.results.length - 1
      const text = event.results[lastResultIndex][0].transcript
      processCommand(text)
      // Do NOT set isListening(false) here, keep listening
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      // If error is 'no-speech' or similar, we might want to ignore.
      // If 'not-allowed', we should stop.
      if (event.error === 'not-allowed') {
        shouldListenRef.current = false
        setIsListening(false)
        setError('Microphone access denied. Please allow microphone permissions.')
      } else if (event.error === 'no-speech') {
        // Ignore, just keep listening (or let it restart via onend if continuous is tricky)
      } else {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      // If we are supposed to be listening, restart!
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch (e) {
          console.error("Failed to restart recognition", e)
          setIsListening(false)
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    // If we were already listening (e.g. language changed), restart immediately
    if (shouldListenRef.current) {
      try {
        recognition.start()
        setIsListening(true)
      } catch (e) { /* ignore start errors */ }
    }

    return () => {
      if (recognition) {
        recognition.onend = null // Prevent auto-restart loop during cleanup
        recognition.stop()
      }
    }
  }, [processCommand, currentLang])

  const handleMicClick = useCallback(() => {
    if (isListening) {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        shouldListenRef.current = true
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [isListening])

  const initializeAssistant = useCallback(() => {
    // Helper to ensure voices are loaded
    window.speechSynthesis.getVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }

    // Auto-speak on load (User Request)
    // Note: This might be blocked by browser autoplay policies if no interaction has occurred.
    const greeting = content.greetings[0]
    speak(greeting)
    addMessage(greeting, 'bot', true)

    // Auto-start listening
    try {
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        shouldListenRef.current = true
        recognitionRef.current?.start()
        setIsListening(true)
        setError(null)
      } else {
        setError('Browser does not support Speech Recognition.')
      }
    } catch (e) {
      console.error("Auto-start failed:", e)
    }
  }, [addMessage, speak, content])

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return
    processCommand(inputValue)
    setInputValue('')
  }, [inputValue, processCommand])

  const handleClearChat = useCallback(() => setMessages([]), [])

  return {
    messages,
    inputValue,
    setInputValue,
    handleSubmit,
    handleMicClick,
    handleClearChat,
    isListening,
    error,
    initializeAssistant
  }
}
