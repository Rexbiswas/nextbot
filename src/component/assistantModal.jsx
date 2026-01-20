import { useState, useEffect, useRef } from 'react'
import { useAssistant } from '../hooks/useAssistant'
import '../styles/assistantModal.css'

function AssistantModal() {
  const [isActive, setIsActive] = useState(false)
  const modalRef = useRef(null)
  const {
    messages,
    inputValue,
    setInputValue,
    handleSubmit,
    handleMicClick,
    handleClearChat,
    isListening,
    error,
    initializeAssistant
  } = useAssistant()

  useEffect(() => {
    // Wait for user interaction (Start Overlay) to initialize
    // This allows audio context to be created/resumed properly for auto-speak
    const handleStart = () => {
      initializeAssistant()
    }
    window.addEventListener('start-nextbot', handleStart)

    return () => {
      window.removeEventListener('start-nextbot', handleStart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    if (isActive) {
      modal.classList.add('active')
    } else {
      modal.classList.remove('active')
    }
  }, [isActive])

  useEffect(() => {
    // Listen for modal open from Navbar
    const handleOpenModal = () => {
      setIsActive(true)
    }

    // Custom event from Navbar
    window.addEventListener('openAssistantModal', handleOpenModal)

    return () => {
      window.removeEventListener('openAssistantModal', handleOpenModal)
    }
  }, [])

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const handleClickOutside = (e) => {
      if (e.target === modal) {
        setIsActive(false)
      }
    }

    modal.addEventListener('click', handleClickOutside)

    return () => {
      modal.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handleClose = () => {
    setIsActive(false)
  }

  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      id="assistantModal"
      ref={modalRef}
      className="assistant-modal"
    >
      <div className="assistant-container">
        <div className="assistant-header">
          <h2>nextbot</h2>
          <button
            id="closeAssistant"
            className="close-btn"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>
        <div
          id="chat"
          ref={chatContainerRef}
          className="chat-container"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.who} ${msg.typing ? 'typing' : ''}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="assistant-controls">
          {error && (
            <div style={{
              color: '#ff4444',
              textAlign: 'center',
              marginBottom: '10px',
              padding: '8px',
              background: 'rgba(255, 68, 68, 0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          <form
            id="inputForm"
            className="input-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
          >
            <input
              type="text"
              id="textInput"
              placeholder="Type your message..."
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </form>
          <div className="control-buttons">
            <button
              id="micBtn"
              className={`control-btn ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
            >
              {isListening ? 'Listening...' : 'Start'}
            </button>
            <button
              id="clearBtn"
              className="control-btn"
              onClick={handleClearChat}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssistantModal