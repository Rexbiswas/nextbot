(function () {
  'use strict';

  const USERS_KEY = 'nextbot_users';
  const SESSION_KEY = 'nextbot_session';

  const Auth = {
    users: {},
    session: null,

    init() {
      try {
        const u = localStorage.getItem(USERS_KEY);
        if (u) this.users = JSON.parse(u);
      } catch (e) {
        console.error('Failed to load users', e);
        this.users = {};
      }

      try {
        const s = localStorage.getItem(SESSION_KEY);
        if (s) this.session = JSON.parse(s);
      } catch (e) {
        console.error('Failed to load session', e);
        this.session = null;
      }

      // create default admin if none exist
      if (!this.users || Object.keys(this.users).length === 0) {
        this.register('admin', 'admin123');
      }
    },

    _saveUsers() { localStorage.setItem(USERS_KEY, JSON.stringify(this.users)); },
    _saveSession() { if (this.session) localStorage.setItem(SESSION_KEY, JSON.stringify(this.session)); else localStorage.removeItem(SESSION_KEY); },

    _hash(p) { return btoa(p); }, // demo-only

    register(username, password, settings = {}) {
      if (!username || !password) return { success: false, message: 'Username and password required' };
      if (this.users[username]) return { success: false, message: 'Username already exists' };

      this.users[username] = {
        username,
        password: this._hash(password),
        settings: { voiceRate:1, voicePitch:1, voiceVolume:1, preferredVoice:'', language:'en-US', theme:'light', ...(settings||{}) },
        created: Date.now()
      };
      this._saveUsers();
      return { success: true, message: 'Registration successful' };
    },

    login(username, password) {
      const user = this.users[username];
      if (!user) return { success: false, message: 'Invalid credentials' };
      if (user.password !== this._hash(password)) return { success: false, message: 'Invalid credentials' };

      this.session = { username: user.username, settings: user.settings, loginTime: Date.now() };
      this._saveSession();
      return { success: true, message: 'Login successful', session: this.session };
    },

    logout() { this.session = null; this._saveSession(); return { success: true }; },
    isLoggedIn() { return !!this.session; },
    getCurrentUser() { return this.session; },

    updateSettings(username, newSettings) {
      if (!this.users[username]) return { success:false, message:'User not found' };
      this.users[username].settings = { ...this.users[username].settings, ...newSettings };
      if (this.session?.username === username) { this.session.settings = this.users[username].settings; this._saveSession(); }
      this._saveUsers();
      return { success:true, settings: this.users[username].settings };
    },

    getSettings(username) { return this.users[username]?.settings || null; },

    getVoiceSettings(username) {
      const s = this.getSettings(username) || this.session?.settings || {};
      return { rate: s.voiceRate||1, pitch: s.voicePitch||1, volume: s.voiceVolume||1, preferredVoice: s.preferredVoice||'', language: s.language||'en-US' };
    }
  };

  Auth.init();
  window.auth = Auth;

  // Minimal login/register modal
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginModal')) return;
    const modalHTML = `
      <div id="loginModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="authTitle">Login to NextBot</h2>
            <button id="authClose" class="close-btn">&times;</button>
          </div>
          <div class="login-form">
            <input id="authUsername" type="text" placeholder="Username" />
            <input id="authPassword" type="password" placeholder="Password" />
            <div id="authError" class="form-error"></div>
            <div class="form-buttons">
              <button id="authLogin" class="primary-btn">Login</button>
              <button id="authRegister" class="secondary-btn">Register</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('loginModal');
    const btnClose = document.getElementById('authClose');
    const btnLogin = document.getElementById('authLogin');
    const btnRegister = document.getElementById('authRegister');
    const title = document.getElementById('authTitle');
    const inputUser = document.getElementById('authUsername');
    const inputPass = document.getElementById('authPassword');
    const err = document.getElementById('authError');

    btnClose.onclick = () => modal.classList.remove('active');
    btnLogin.onclick = () => {
      err.textContent = '';
      const u = inputUser.value.trim();
      const p = inputPass.value;
      if (!u || !p) { err.textContent = 'Enter username and password'; return; }
      const r = Auth.login(u,p);
      if (r.success) { modal.classList.remove('active'); location.reload(); } else err.textContent = r.message;
    };
    btnRegister.onclick = () => {
      err.textContent = '';
      const u = inputUser.value.trim();
      const p = inputPass.value;
      if (!u || !p) { err.textContent = 'Enter username and password'; return; }
      const r = Auth.register(u,p);
      if (r.success) { Auth.login(u,p); modal.classList.remove('active'); location.reload(); } else err.textContent = r.message;
    };

    window.showLogin = () => { inputUser.value=''; inputPass.value=''; err.textContent=''; title.textContent='Login to NextBot'; btnLogin.style.display=''; btnRegister.textContent='Register'; modal.classList.add('active'); inputUser.focus(); };

    const style = document.createElement('style');
    style.textContent = `
      .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center}
      .modal.active{display:flex}
      .modal-content{background:#fff;padding:18px;border-radius:8px;max-width:420px;width:92%}
      .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
      .close-btn{background:none;border:none;font-size:22px;cursor:pointer}
      .login-form input{width:100%;padding:8px;margin-bottom:10px;border:1px solid #ddd;border-radius:4px}
      .form-error{color:#c00;min-height:18px;margin-bottom:8px}
      .form-buttons{display:flex;gap:8px}
      .primary-btn{background:#007bff;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer}
      .secondary-btn{background:#6c757d;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer}
    `;
    document.head.appendChild(style);
  });

})();