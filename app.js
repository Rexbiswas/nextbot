(() => {
  'use strict';

  // --- UI elements
  const micBtn = document.getElementById('micBtn');
  const clearBtn = document.getElementById('clearBtn');
  const chat = document.getElementById('chat');
  const inputForm = document.getElementById('inputForm');
  const textInput = document.getElementById('textInput');
  const reminderListEl = document.getElementById('reminderList');
  const todoListEl = document.getElementById('todoList');
  const assistantModal = document.getElementById('assistantModal');
  const closeAssistant = document.getElementById('closeAssistant');
  const letsTalkBtn = document.getElementById('letsTalkBtn');

  // --- persistence keys
  const REM_KEY = 'nextbot_reminders';
  const TODO_KEY = 'nextbot_todos';


  // --- nextbot personality
  const NEXTBOT = {
    name: 'nextbot',
    voice: 'en-US',
    rate: 0.95,
    pitch: 0.9,
    volume: 1,
    greetings: [
      "Hello! I'm nextbot. How can I help you today?",
      "Hey there! nextbot here, ready to assist.",
      "Greetings! I'm nextbot. What can I do for you?",
      "nextbot online. How may I be of service?",
      "Hi! This is nextbot. How can I assist you today?"
    ],
    acknowledgements: [
      "Got it!",
      "Done!",
      "Sure thing!",
      "Alright!",
      "Processing now.",
      "Consider it done.",
      "Will do."
    ],
    errors: [
      "I'm sorry, I didn't understand that.",
      "Could you rephrase that?",
      "I'm not sure what you mean.",
      "Could you be more specific?",
      "I didn't catch that. Please try again."
    ]
  };

  // --- Enhanced Speech setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

  // Basic command grammar to slightly improve recognition on short commands
  const grammarPhrases = ['hello', 'hi', 'hey', 'help', 'what time is it', 'what day is it', 'search for', 'open', 'remind me', 'add todo', 'clear reminders', 'clear todos'];
  const grammar = '#JSGF V1.0; grammar commands; public <command> = ' + grammarPhrases.join(' | ') + ' ;';

  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  const grammarList = SpeechGrammarList ? new SpeechGrammarList() : null;

  if (!recognition) {
    console.warn('Speech recognition is not supported in this browser');
    setTimeout(() => {
      appendMessage('Speech recognition is not supported in your browser. Try Chrome for best support.', 'bot');
    }, 800);
  } else {
    if (grammarList) {
      try { grammarList.addFromString(grammar, 1); recognition.grammars = grammarList; } catch { /* ignore */ }
    }

    // Apply user language if available
    const currentUser = window.auth?.getCurrentUser?.();
    const userLang = currentUser?.settings?.language || NEXTBOT.voice;

    recognition.lang = userLang;
    recognition.continuous = false;
    recognition.interimResults = true; // show interim results
    recognition.maxAlternatives = 3;
  }

  // --- Advanced TTS with nextbot voice
  function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    const ut = new SpeechSynthesisUtterance(text);
    // Merge options with user preferences (if logged in)
    const user = window.auth?.getCurrentUser?.();
    const userSettings = user?.settings || {};

    ut.rate = options.rate || userSettings.voiceRate || NEXTBOT.rate;
    ut.pitch = options.pitch || userSettings.voicePitch || NEXTBOT.pitch;
    ut.volume = options.volume || userSettings.voiceVolume || NEXTBOT.volume;
    ut.lang = options.lang || userSettings.language || NEXTBOT.voice;
    
    // Try to get a more natural voice
    const voices = speechSynthesis.getVoices();
    // Prefer a user selected voice if available
    const preferredName = user?.settings?.preferredVoice;
    let preferred = null;
    if (preferredName) preferred = voices.find(v => v.name === preferredName);
    if (!preferred) preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced'));
    if (preferred) ut.voice = preferred;
    
    window.speechSynthesis.speak(ut);
  }

  // --- Enhanced chat helpers with typing effect
  function appendMessage(text, who = 'bot', options = {}) {
    const el = document.createElement('div');
    el.className = `message ${who}`;
    
    if (options.typing && who === 'bot') {
      el.textContent = '';
      el.classList.add('typing');
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
      
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          el.textContent += text[i];
          chat.scrollTop = chat.scrollHeight;
          i++;
        } else {
          el.classList.remove('typing');
          clearInterval(typingInterval);
        }
      }, 20);
    } else {
      el.textContent = text;
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }
  }

  function userMessage(text) {
    appendMessage(text, 'user');
  }

  // --- JARVIS responses
  function jarvisSpeak(text, showTyping = true) {
    appendMessage(text, 'bot', { typing: showTyping });
    speak(text);
  }

  function jarvisAcknowledge() {
    const msg = NEXTBOT.acknowledgements[Math.floor(Math.random() * NEXTBOT.acknowledgements.length)];
    speak(msg);
  }

  // --- Local storage helpers
  function loadReminders() {
    try { return JSON.parse(localStorage.getItem(REM_KEY) || '[]'); } 
    catch { return []; }
  }

  function saveReminders(arr) { 
    localStorage.setItem(REM_KEY, JSON.stringify(arr)); 
  }

  function loadTodos() {
    try { return JSON.parse(localStorage.getItem(TODO_KEY) || '[]'); } 
    catch { return []; }
  }

  function saveTodos(arr) { 
    localStorage.setItem(TODO_KEY, JSON.stringify(arr)); 
  }





  // --- Reminder scheduling
  let scheduledTimeouts = {};

  function scheduleReminder(reminder) {
    const id = reminder.id;
    const ms = reminder.time - Date.now();

    if (ms <= 0) {
      triggerReminder(reminder);
      return;
    }

    if (scheduledTimeouts[id]) clearTimeout(scheduledTimeouts[id]);

    scheduledTimeouts[id] = setTimeout(() => {
      triggerReminder(reminder);
      delete scheduledTimeouts[id];
    }, ms);
  }

  function triggerReminder(reminder) {
    const text = `Reminder: ${reminder.text}`;
    appendMessage(text, 'bot');
    speak(`Sir, your reminder: ${reminder.text}`);
    
    const rems = loadReminders().filter(r => r.id !== reminder.id);
    saveReminders(rems);
    renderReminders();
  }

  // --- UI rendering
  function renderReminders() {
    if (!reminderListEl) return;
    
    const rems = loadReminders().sort((a, b) => a.time - b.time);
    reminderListEl.innerHTML = '';

    if (rems.length === 0) {
      reminderListEl.innerHTML = '<li style="color: #888; font-style: italic;">No active reminders</li>';
      return;
    }

    rems.forEach(r => {
      const li = document.createElement('li');
      const when = new Date(r.time);
      const now = Date.now();
      const msUntil = when - now;
      const timeUntil = msUntil > 0 ? formatTimeUntil(msUntil) : 'Overdue';

      li.innerHTML = `<div>
        <strong>${r.text}</strong>
        <small>${when.toLocaleString()}</small>
        <small style="display: block; color: ${msUntil < 60000 ? '#e74c3c' : '#3498db'}; margin-top: 4px;">⏱ ${timeUntil}</small>
      </div>`;

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'delete-btn';
      del.onclick = () => {
        const all = loadReminders().filter(x => x.id !== r.id);
        saveReminders(all);
        if (scheduledTimeouts[r.id]) {
          clearTimeout(scheduledTimeouts[r.id]);
          delete scheduledTimeouts[r.id];
        }
        renderReminders();
        jarvisAcknowledge();
      };

      li.appendChild(del);
      reminderListEl.appendChild(li);
    });
  }

  function renderTodos() {
    if (!todoListEl) return;
    
    const todos = loadTodos();
    todoListEl.innerHTML = '';

    if (todos.length === 0) {
      todoListEl.innerHTML = '<li style="color: #888; font-style: italic;">No tasks</li>';
      return;
    }

    todos.forEach((t, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<div>
        <strong${t.done ? ' style="text-decoration:line-through; opacity: 0.6"' : ''}>${t.text}</strong>
      </div>`;

      const toggle = document.createElement('button');
      toggle.textContent = t.done ? 'Undo' : 'Done';
      toggle.className = t.done ? 'undo-btn' : 'done-btn';
      toggle.onclick = () => {
        const all = loadTodos();
        all[i].done = !all[i].done;
        saveTodos(all);
        renderTodos();
        speak(all[i].done ? 'Task marked complete' : 'Task restored');
      };

      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.className = 'delete-btn';
      del.onclick = () => {
        const all = loadTodos();
        all.splice(i, 1);
        saveTodos(all);
        renderTodos();
        jarvisAcknowledge();
      };

      li.appendChild(toggle);
      li.appendChild(del);
      todoListEl.appendChild(li);
    });
  }

  // --- Utility functions
  function formatTimeUntil(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  // --- Command parsing and execution
  function parseAndExecute(text) {
    text = text.trim();
    userMessage(text);

    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(text)) {
      const greeting = NEXTBOT.greetings[Math.floor(Math.random() * NEXTBOT.greetings.length)];
      jarvisSpeak(greeting);
      return;
    }

    // Who are you
    if (/who are you|what are you|your name/i.test(text)) {
      jarvisSpeak("I'm nextbot, your personal assistant. I can help you with reminders, tasks, information, and various other tasks.");
      return;
    }

    // Weather inquiry
    if (/weather|temperature|forecast/i.test(text)) {
      jarvisSpeak("I don't have direct access to weather data, but I can search the web for current weather information.");
      setTimeout(() => {
        window.open('https://www.google.com/search?q=weather', '_blank');
      }, 500);
      return;
    }

    // Reminders - "remind me to X in Y minutes/hours/days"
    const remindMatchIn = text.match(/remind me (?:to|about) (.+?) (?:in|after) (\d+)\s*(seconds?|minutes?|hours?|days?)/i);
    if (remindMatchIn) {
      const what = remindMatchIn[1].trim();
      const amount = parseInt(remindMatchIn[2], 10);
      const unit = remindMatchIn[3].toLowerCase();

      let ms = 0;
      if (unit.startsWith('second')) ms = amount * 1000;
      else if (unit.startsWith('minute')) ms = amount * 60 * 1000;
      else if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000;
      else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000;

      const when = Date.now() + ms;
      const newR = { id: 'r:' + Date.now() + Math.random(), text: what, time: when };
      const all = loadReminders();
      all.push(newR);
      saveReminders(all);
      scheduleReminder(newR);

      const resp = `I'll remind you to "${what}" in ${amount} ${unit}.`;
      jarvisSpeak(resp);
      renderReminders();
      return;
      
    }

    // Reminders at specific time - "remind me at HH:MM"
    const remindAt = text.match(/remind me (?:to|about) (.+?) at (\d{1,2}:\d{2})/i);
    if (remindAt) {
      const what = remindAt[1];
      const timeStr = remindAt[2];
      const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));

      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);

      if (target.getTime() - now.getTime() <= 0) {
        target.setDate(target.getDate() + 1);
      }

      const newR = { id: 'r:' + Date.now() + Math.random(), text: what, time: target.getTime() };
      const all = loadReminders();
      all.push(newR);
      saveReminders(all);
      scheduleReminder(newR);

      const resp = `I'll remind you to "${what}" at ${target.toLocaleTimeString()}.`;
      jarvisSpeak(resp);
      renderReminders();
      return;
    }

    // Save note
    const noteMatch = text.match(/^(?:note|remember that|save)\s*:?\s*(.+)/i);
    if (noteMatch) {
      const note = noteMatch[1].trim();
      const todos = loadTodos();
      todos.push({ text: note, done: false });
      saveTodos(todos);
      jarvisSpeak(`I've saved your note: "${note}".`);
      renderTodos();
      return;
    }

    // Add todo
    const todoAdd = text.match(/(?:add|create|new)\s+(?:todo|task)\s+:?\s*(.+)/i);
    if (todoAdd) {
      const item = todoAdd[1].trim();
      const todos = loadTodos();
      todos.push({ text: item, done: false });
      saveTodos(todos);
      jarvisSpeak(`Added task: "${item}".`);
      renderTodos();
      return;
    }

    // List todos
    if (/^(?:list|show|display)\s+(?:todos|tasks|my tasks)/i.test(text)) {
      const todos = loadTodos();
      if (todos.length === 0) {
        jarvisSpeak("You have no tasks at the moment.");
        return;
      }
      const activeTodos = todos.filter(t => !t.done);
      const completedTodos = todos.filter(t => t.done);

      let resp = `You have ${activeTodos.length} active task${activeTodos.length !== 1 ? 's' : ''}.`;
      if (completedTodos.length > 0) {
        resp += ` ${completedTodos.length} completed.`;
      }
      
      jarvisSpeak(resp);
      appendMessage("Your tasks:", 'bot');
      activeTodos.forEach((t, i) => appendMessage(`${i + 1}. ${t.text}`, 'bot', { typing: false }));
      return;
    }

    // Time
    if (/what(?:'s| is) (?:the )?time|tell me the time|current time/i.test(text)) {
      const now = new Date();
      const resp = `The current time is ${now.toLocaleTimeString()}.`;
      jarvisSpeak(resp);
      return;
    }

    // Date
    if (/what(?:'s| is) (?:the )?date|tell me the date|what day/i.test(text)) {
      const now = new Date();
      const resp = `Today is ${now.toLocaleDateString()}, ${now.toLocaleDateString('en-US', { weekday: 'long' })}.`;
      jarvisSpeak(resp);
      return;
    }

    // Search web
    const searchMatch = text.match(/(?:search|find|look up|google)\s+(?:for\s+)?(.+)/i);
    if (searchMatch) {
      const q = encodeURIComponent(searchMatch[1]);
      jarvisSpeak(`Searching the web for: ${searchMatch[1]}.`);
      setTimeout(() => {
        window.open(`https://www.google.com/search?q=${q}`, '_blank');
      }, 500);
      return;
    }

    // Open website
    const openMatch = text.match(/open\s+(https?:\/\/\S+|www\.\S+|.+)/i);
    if (openMatch) {
      let target = openMatch[1];
      
      if (!/^https?:\/\//i.test(target) && !/^www\./i.test(target)) {
        const q = encodeURIComponent(target);
        jarvisSpeak(`Searching for: ${target}.`);
        setTimeout(() => {
          window.open(`https://www.google.com/search?q=${q}`, '_blank');
        }, 500);
        return;
      }

      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
      
      jarvisSpeak(`Opening ${target}.`);
      setTimeout(() => {
        window.open(target, '_blank');
      }, 500);
      return;
    }

    // Clear data
    if (/clear (?:all )?(?:reminders|todos|history|data)/i.test(text)) {
      if (/reminders/i.test(text)) {
        const count = loadReminders().length;
        saveReminders([]);
        Object.keys(scheduledTimeouts).forEach(k => clearTimeout(scheduledTimeouts[k]));
        scheduledTimeouts = {};
        jarvisSpeak(`I've cleared all ${count} reminders.`);
        renderReminders();
      } else if (/todos/i.test(text)) {
        const count = loadTodos().length;
        saveTodos([]);
        jarvisSpeak(`I've cleared all ${count} tasks.`);
        renderTodos();
      } else {
        localStorage.clear();
        jarvisSpeak("All data has been cleared.");
        renderReminders();
        renderTodos();
      }
      return;
    }

    // Help
    if (/^help|what can you do|capabilities|commands/i.test(text)) {
      const helpText = `I can help you with:
• Reminders: "remind me to call mom in 30 minutes"
• Tasks: "add todo buy groceries"
• Notes: "note: meeting at 3pm"
• Time & Date: "what's the time"
• Web search: "search for AI robotics"
• Clear data: "clear reminders" or "clear todos"

You can also speak commands using the microphone button.`;
      jarvisSpeak(helpText, false);
      return;
    }

  // Fallback
  const error = NEXTBOT.errors[Math.floor(Math.random() * NEXTBOT.errors.length)];
  jarvisSpeak(error + " Try saying 'help' for a list of available commands.");
  }

  // --- Event listeners
  if (inputForm) {
    inputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = textInput.value.trim();
      if (!txt) return;
      parseAndExecute(txt);
      textInput.value = '';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chat.innerHTML = '';
      jarvisSpeak("Chat cleared.");
    });
  }

  if (recognition && micBtn) {
    let listening = false;
    let interimEl = null;

    async function ensureMicPermission() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop tracks - we only requested permission
        s.getTracks().forEach(t => t.stop());
        return true;
      } catch (e) {
        console.error('Microphone permission denied or unavailable', e);
        appendMessage('Microphone access denied or unavailable. Please allow microphone access.', 'bot');
        return false;
      }
    }

    micBtn.addEventListener('click', async () => {
      listening = !listening;

      if (listening) {
        const ok = await ensureMicPermission();
        if (!ok) { listening = false; return; }

        try {
          recognition.start();
          micBtn.textContent = 'Listening...';
          micBtn.classList.add('listening');
        } catch (err) {
          console.error('Failed to start recognition', err);
          appendMessage('Could not start voice recognition.', 'bot');
          listening = false;
        }
      } else {
        recognition.stop();
        micBtn.textContent = 'Start';
        micBtn.classList.remove('listening');
      }
    });

    recognition.onresult = (ev) => {
      try {
        let interim = '';
        let final = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) final += res[0].transcript;
          else interim += res[0].transcript;
        }

        if (interim) {
          if (!interimEl) {
            interimEl = document.createElement('div');
            interimEl.className = 'message bot interim';
            interimEl.textContent = interim;
            chat.appendChild(interimEl);
            chat.scrollTop = chat.scrollHeight;
          } else {
            interimEl.textContent = interim;
            chat.scrollTop = chat.scrollHeight;
          }
        }

        if (final) {
          if (interimEl) { interimEl.remove(); interimEl = null; }
          console.log('Final recognized text:', final);
          parseAndExecute(final);
          // stop listening after final
          recognition.stop();
          micBtn.textContent = 'Start';
          micBtn.classList.remove('listening');
          listening = false;
        }
      } catch (error) {
        console.error('Error processing speech result:', error);
        appendMessage('Sorry, I had trouble understanding that. Please try again.', 'bot');
      }
    };

    recognition.onerror = (ev) => {
      console.error('Speech recognition error:', ev.error);
      let errorMessage = 'Speech recognition error: ';
      switch (ev.error) {
        case 'no-speech':
          errorMessage += 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage += 'No microphone was found. Ensure it is plugged in and allowed.';
          break;
        case 'not-allowed':
          errorMessage += 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage += 'Network error occurred. Please check your internet connection.';
          break;
        default:
          errorMessage += ev.error;
      }

      appendMessage(errorMessage, 'bot');
      micBtn.textContent = 'Start';
      micBtn.classList.remove('listening');
      listening = false;
      if (interimEl) { interimEl.remove(); interimEl = null; }
    };

    recognition.onend = () => {
      if (listening) {
        // restart short delay to avoid immediate loop
        setTimeout(() => {
          try { recognition.start(); } catch (e) { console.warn('Could not restart recognition', e); }
        }, 200);
      } else {
        micBtn.textContent = 'Start';
        micBtn.classList.remove('listening');
        if (interimEl) { interimEl.remove(); interimEl = null; }
      }
    };
  } else if (micBtn) {
    micBtn.style.display = 'none';
  }

  // --- Modal controls
  if (letsTalkBtn) {
    letsTalkBtn.addEventListener('click', () => {
      assistantModal.classList.add('active');
    });
  }

  if (closeAssistant) {
    closeAssistant.addEventListener('click', () => {
      assistantModal.classList.remove('active');
    });
  }

  if (assistantModal) {
    assistantModal.addEventListener('click', (e) => {
      if (e.target === assistantModal) {
        assistantModal.classList.remove('active');
      }
    });
  }

  // --- Initialize
  (function init() {
    // Load voices
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };

    renderTodos();
    renderReminders();
    
    const rems = loadReminders() || [];
    rems.forEach(r => scheduleReminder(r));

  const greeting = NEXTBOT.greetings[Math.floor(Math.random() * NEXTBOT.greetings.length)];
    appendMessage(greeting, 'bot', { typing: true });
    speak(greeting);
  })();

})();