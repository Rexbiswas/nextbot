import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'nextbot_users'
const SESSION_KEY = 'nextbot_session'

const hash = (p) => btoa(p) // demo-only

export function AuthProvider({ children }) {
  const [users, setUsers] = useState({})
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Load users
    let currentUsers = {};
    try {
      const u = localStorage.getItem(USERS_KEY)
      if (u) {
        currentUsers = JSON.parse(u);
        setUsers(currentUsers);
      }
    } catch (e) {
      console.error('Failed to load users', e)
      setUsers({})
    }

    // Load session
    try {
      const s = localStorage.getItem(SESSION_KEY)
      if (s) setSession(JSON.parse(s))
    } catch (e) {
      console.error('Failed to load session', e)
      setSession(null)
    }

    // Create default admin if none exist
    if (!currentUsers || Object.keys(currentUsers).length === 0) {
      const newUsers = {
        admin: {
          username: 'admin',
          password: hash('admin123'),
          settings: {
            voiceRate: 1,
            voicePitch: 1,
            voiceVolume: 1,
            preferredVoice: '',
            language: 'en-US',
            theme: 'light',
          },
          created: Date.now()
        }
      };
      localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      setUsers(newUsers);
    }
  }, [])

  const saveUsers = (usersData) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(usersData))
    setUsers(usersData)
  }

  const saveSession = (sessionData) => {
    if (sessionData) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
      setSession(sessionData)
    } else {
      localStorage.removeItem(SESSION_KEY)
      setSession(null)
    }
  }

  const register = (username, password, settings = {}) => {
    if (!username || !password) {
      return { success: false, message: 'Username and password required' }
    }
    if (users[username]) {
      return { success: false, message: 'Username already exists' }
    }

    const newUsers = {
      ...users,
      [username]: {
        username,
        password: hash(password),
        settings: {
          voiceRate: 1,
          voicePitch: 1,
          voiceVolume: 1,
          preferredVoice: '',
          language: 'en-US',
          theme: 'light',
          ...settings
        },
        created: Date.now()
      }
    }
    saveUsers(newUsers)
    return { success: true, message: 'Registration successful' }
  }

  const login = (username, password, skipPasswordCheck = false) => {
    const user = users[username]
    if (!user) {
      return { success: false, message: 'Invalid credentials' }
    }
    if (!skipPasswordCheck && user.password !== hash(password)) {
      return { success: false, message: 'Invalid credentials' }
    }

    const newSession = {
      username: user.username,
      settings: user.settings,
      loginTime: Date.now()
    }
    saveSession(newSession)
    return { success: true, message: 'Login successful', session: newSession }
  }

  const logout = () => {
    saveSession(null)
    return { success: true }
  }

  const updateSettings = (username, newSettings) => {
    if (!users[username]) {
      return { success: false, message: 'User not found' }
    }
    const updatedUsers = {
      ...users,
      [username]: {
        ...users[username],
        settings: { ...users[username].settings, ...newSettings }
      }
    }
    saveUsers(updatedUsers)

    if (session?.username === username) {
      saveSession({
        ...session,
        settings: updatedUsers[username].settings
      })
    }
    return { success: true, settings: updatedUsers[username].settings }
  }

  const getSettings = (username) => {
    return users[username]?.settings || null
  }

  // Face Auth Functions
  const registerFace = (username, descriptor) => {
    if (!users[username]) return { success: false, message: 'User not found' }

    // Descriptor is a Float32Array, convert to array for storage
    const descriptorArray = Array.from(descriptor)

    const updatedUsers = {
      ...users,
      [username]: {
        ...users[username],
        faceDescriptor: descriptorArray
      }
    }
    saveUsers(updatedUsers)
    return { success: true, message: 'Face registered successfully' }
  }

  const verifyFace = (descriptor) => {
    // Simple Euclidean distance check
    // In a real app with many users, use a labeled face descriptor matcher

    let bestMatch = { username: null, distance: 1.0 }

    Object.values(users).forEach(user => {
      if (user.faceDescriptor) {
        // Euclidean distance calculation
        const storedDesc = user.faceDescriptor
        const distance = Math.sqrt(
          descriptor.reduce((sum, val, i) => sum + Math.pow(val - storedDesc[i], 2), 0)
        )

        if (distance < bestMatch.distance) {
          bestMatch = { username: user.username, distance }
        }
      }
    })

    // Threshold of 0.6 is standard for dlib/face-api
    if (bestMatch.distance < 0.5) {
      return login(bestMatch.username, null, true) // Pass true for skipPasswordCheck
    }

    return { success: false, message: 'Face not recognized' }
  }

  const getVoiceSettings = (username) => {
    const s = getSettings(username) || session?.settings || {}
    return {
      rate: s.voiceRate || 1,
      pitch: s.voicePitch || 1,
      volume: s.voiceVolume || 1,
      preferredVoice: s.preferredVoice || '',
      language: s.language || 'en-US'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoggedIn: !!session,
        getCurrentUser: () => session,
        register,
        login,
        logout,
        updateSettings,
        getSettings,
        getVoiceSettings,
        registerFace,
        verifyFace
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

