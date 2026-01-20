import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext'

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
  const processCommand = useCallback((text) => {
    const rawText = text
    text = text.trim()
    addMessage(rawText, 'user')

    // 1. Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|hola|bonjour|hallo)/i.test(text)) {
      const greeting = content.greetings[Math.floor(Math.random() * content.greetings.length)]
      speak(greeting)
      addMessage(greeting, 'bot', true)
      return
    }

    // 2. Who are you
    if (/who are you|what are you|your name/i.test(text)) {
      const msg = "I'm nextbot, your personal assistant."
      speak(msg)
      addMessage(msg, 'bot', true)
      return
    }

    // 3. Reminders (In X time)
    const remindMatchIn = text.match(/remind me (?:to|about) (.+?) (?:in|after) (\d+)\s*(seconds?|minutes?|hours?|days?)/i)
    if (remindMatchIn) {
      const what = remindMatchIn[1].trim()
      const amount = parseInt(remindMatchIn[2], 10)
      const unit = remindMatchIn[3].toLowerCase()

      let ms = 0
      if (unit.startsWith('second')) ms = amount * 1000
      else if (unit.startsWith('minute')) ms = amount * 60 * 1000
      else if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000
      else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000

      const when = Date.now() + ms
      const newR = { id: 'r:' + Date.now() + Math.random(), text: what, time: when }
      
      const all = loadReminders()
      all.push(newR)
      saveReminders(all)
      scheduleReminder(newR)

      const resp = `I'll remind you to "${what}" in ${amount} ${unit}.`
      speak(resp)
      addMessage(resp, 'bot', true)
      return
    }

    // 4. Time
    if (/what(?:'s| is) (?:the )?time|tell me the time/i.test(text)) {
      const now = new Date()
      const resp = `The time is ${now.toLocaleTimeString()}.`
      speak(resp)
      addMessage(resp, 'bot', true)
      return
    }

    // 5. Search
    const searchMatch = text.match(/(?:search|find|look up|google)\s+(?:for\s+)?(.+)/i)
    if (searchMatch) {
      const q = encodeURIComponent(searchMatch[1])
      const resp = `Searching for ${searchMatch[1]}...`
      speak(resp)
      addMessage(resp, 'bot', true)
      setTimeout(() => window.open(`https://www.google.com/search?q=${q}`, '_blank'), 1000)
      return
    }

    // 6. Todos - Add
    const todoAdd = text.match(/(?:add|create|new)\s+(?:todo|task)\s+:?\s*(.+)/i)
    if (todoAdd) {
      const item = todoAdd[1].trim()
      const todos = loadTodos()
      todos.push({ text: item, done: false })
      saveTodos(todos)
      const resp = `Added task: "${item}".`
      speak(resp)
      addMessage(resp, 'bot')
      return
    }

    // 7. Clear Chat
    if (/clear chat|clear history/i.test(text)) {
        setMessages([])
        speak("Chat cleared.")
        return
    }

    // 8. System Commands (Open Apps)
    const sysMatch = text.match(/(?:open|start|launch)\s+(.+)/i)
    if (sysMatch && !text.match(/^search/i)) { // Avoid conflict with search
        const appName = sysMatch[1].trim()
        // Filter out "google" or "youtube" if we want those to remain web searches? 
        // For now, let's treat "open google" as a system command if user wants, 
        // but typically "open notepad" is what we target.
        
        const resp = `Opening ${appName}...`
        speak(resp)
        addMessage(resp, 'bot', true)
        
        try {
            fetch('http://localhost:3002/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: appName })
            }).catch(err => {
                console.error("Bridge Error:", err)
                addMessage("I couldn't reach the system bridge. Is server.js running?", 'bot')
            })
        } catch (e) {
            console.error(e)
        }
        return
    }

    // 9. Camera Control (Shutdown/Disable)
    if (/(shut down|turn off|disable) (the )?(camera|webcam|visual input)/i.test(text)) {
        window.dispatchEvent(new CustomEvent('shutdown-camera'))
        const resp = "Visual input systems offline."
        speak(resp)
        addMessage(resp, 'bot', true)
        return
    }

    if (/(turn on|enable|start) (the )?(camera|webcam|visual input)/i.test(text)) {
        window.dispatchEvent(new CustomEvent('start-camera'))
        const resp = "Visual input systems online."
        speak(resp)
        addMessage(resp, 'bot', true)
        return
    }

    // Fallback
    const err = content.errors[Math.floor(Math.random() * content.errors.length)]
    speak(err)
    addMessage(err, 'bot', true)

  }, [speak, addMessage, scheduleReminder])

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
  }, [addMessage, speak])

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
    handleMicClick,
    handleClearChat,
    isListening,
    error,
    initializeAssistant
  }
}
