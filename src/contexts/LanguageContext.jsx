import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

export const LANGUAGES = {
    EN: { code: 'en-US', name: 'English' },
    ES: { code: 'es-ES', name: 'Español' },
    FR: { code: 'fr-FR', name: 'Français' },
    DE: { code: 'de-DE', name: 'Deutsch' }
}

export function LanguageProvider({ children }) {
    // Default to EN or load from localStorage
    const [currentLang, setCurrentLang] = useState(() => {
        return localStorage.getItem('nextbot_language') || 'EN'
    })

    useEffect(() => {
        localStorage.setItem('nextbot_language', currentLang)
    }, [currentLang])

    return (
        <LanguageContext.Provider value={{ currentLang, setCurrentLang, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
