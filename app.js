/**
 * OmeChat — Main App Controller (app.js)
 *
 * Bootstraps the landing page.
 * Wires Auth, DB, UI, ChatEngine together.
 * Handles all modal flows, chat room lifecycle, nav state.
 */

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  _initAgeGate();
  _initNav();
  _initModalHandlers();
  UI.initOverlayClose(['age-modal', 'underage-modal', 'ban-modal']);
  UI.updateNav(Auth.current());
});

// ═══════════════════════════════════════════════════════════
// AGE GATE
// ═══════════════════════════════════════════════════════════
function _initAgeGate() {
  if (!DB.isAgeVerified()) {
    UI.openModal('age-modal');
  }
}

function confirmAge() {
  DB.setAgeVerified();
  UI.closeModal('age-modal');
}

function denyAge() {
  UI.closeModal('age-modal');
  UI.openModal('underage-modal');
}

// ═══════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════
function _initNav() {
  document.getElementById('btn-nav-login')  ?.addEventListener('click', () => UI.openModal('login-modal'));
  document.getElementById('btn-nav-signup') ?.addEventListener('click', () => UI.openModal('signup-modal'));
  document.getElementById('btn-nav-logout') ?.addEventListener('click', handleLogout);
  document.getElementById('btn-m-login')   ?.addEventListener('click', () => { UI.toggleMobileMenu(); UI.openModal('login-modal'); });
  document.getElementById('btn-m-signup')  ?.addEventListener('click', () => { UI.toggleMobileMenu(); UI.openModal('signup-modal'); });
  document.getElementById('btn-m-logout')  ?.addEventListener('click', () => { UI.toggleMobileMenu(); handleLogout(); });
  document.getElementById('btn-m-premium') ?.addEventListener('click', () => { UI.toggleMobileMenu(); showPremiumModal(); });
}

function toggleMobileMenu() { UI.toggleMobileMenu(); }

// ═══════════════════════════════════════════════════════════
// AUTH FLOWS
// ═══════════════════════════════════════════════════════════
function _initModalHandlers() {
  // Login
  document.getElementById('form-login')?.addEventListener('submit', e => { e.preventDefault(); handleEmailLogin(); });
  // Signup
  document.getElementById('form-signup')?.addEventListener('submit', e => { e.preventDefault(); handleEmailSignup(); });
  // Chat input enter key
  document.getElementById('chat-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitChatMessage(); });
  // Country select
  document.getElementById('country-select')?.addEventListener('change', () => {});
}

function handleEmailLogin() {
  UI.clearAlert('login-error');
  const email    = UI.getVal('login-email');
  const password = UI.getVal('login-password');
  UI.setLoading('btn-email-login', true);

  setTimeout(() => {
    const result = Auth.loginWithEmail(email, password);
    UI.setLoading('btn-email-login', false);

    if (result.error === 'banned') {
      UI.closeModal('login-modal');
      _showBanModal(result.reason, email);
      return;
    }
    if (result.error) { UI.showAlert('login-error', result.error); return; }

    UI.closeModal('login-modal');
    UI.clearForm('login-email', 'login-password');
    UI.updateNav(Auth.current());
    UI.toast('Welcome back, ' + result.user.name + '!', 'success');
  }, 400);
}

function handleEmailSignup() {
  UI.clearAlert('signup-error');
  const name     = UI.getVal('signup-name');
  const email    = UI.getVal('signup-email');
  const password = UI.getVal('signup-password');
  UI.setLoading('btn-email-signup', true);

  setTimeout(() => {
    const result = Auth.signupWithEmail(name, email, password);
    UI.setLoading('btn-email-signup', false);

    if (result.error === 'banned') {
      UI.closeModal('signup-modal');
      _showBanModal(result.reason, email);
      return;
    }
    if (result.error) { UI.showAlert('signup-error', result.error); return; }

    UI.closeModal('signup-modal');
    UI.clearForm('signup-name', 'signup-email', 'signup-password');
    UI.updateNav(Auth.current());
    UI.toast('Account created! Welcome, ' + result.user.name + '!', 'success');
  }, 400);
}

function handleFacebookAuth() {
  const result = Auth.loginWithFacebook();
  if (result.error === 'banned') { _showBanModal(result.reason); return; }
  if (result.error && result.error !== 'Cancelled.') { UI.toast(result.error, 'error'); return; }
  if (result.ok) {
    UI.closeAllModals();
    UI.updateNav(Auth.current());
    UI.toast('Welcome, ' + result.user.name + '!', 'success');
  }
}

function handleLogout() {
  Auth.logout();
  stopChat();
  UI.updateNav(null);
  UI.toast('You have been logged out.', 'info');
}

// ═══════════════════════════════════════════════════════════
// BAN FLOW
// ═══════════════════════════════════════════════════════════
let _bannedEmail = null;

function _showBanModal(reason, email) {
  _bannedEmail = email || Auth.current()?.email;
  const el = document.getElementById('ban-reason-text');
  if (el) el.textContent = 'Reason: ' + (reason || 'Terms of Service violation.');
  UI.openModal('ban-modal');
}

function showUnbanModal() {
  UI.closeModal('ban-modal');
  if (_bannedEmail) UI.setVal('unban-email', _bannedEmail);
  UI.openModal('unban-modal');
}

function submitUnbanRequest() {
  UI.clearAlert('unban-alert');
  const email = UI.getVal('unban-email');
  const txId  = UI.getVal('unban-txid');
  const result = Auth.requestUnban(email, txId);
  if (result.error) { UI.showAlert('unban-alert', result.error); return; }
  UI.showAlert('unban-alert', 'Request submitted. You will be unbanned within 24 hours after payment verification.', 'success');
  UI.clearForm('unban-txid');
}

// ═══════════════════════════════════════════════════════════
// PREMIUM FLOW
// ═══════════════════════════════════════════════════════════
function showPremiumModal() {
  if (!Auth.isLoggedIn()) { UI.openModal('login-modal'); return; }
  if (Auth.current().premium) { UI.toast('You already have Premium! ⭐', 'info'); return; }
  UI.openModal('premium-modal');
}

function submitPremiumRequest() {
  UI.clearAlert('premium-alert');
  const txId = UI.getVal('premium-txid');
  const result = Auth.requestPremium(txId);
  if (result.error) { UI.showAlert('premium-alert', result.error); return; }
  UI.showAlert('premium-alert', 'Submitted! Premium will be activated within 24 hours after payment verification.', 'success');
  UI.clearForm('premium-txid');
}

// ═══════════════════════════════════════════════════════════
// CHAT ROOM
// ═══════════════════════════════════════════════════════════
async function startChat() {
  if (!Auth.isLoggedIn()) { UI.openModal('login-modal'); return; }

  const user = Auth.current();
  if (user.banned) { _showBanModal(user.banReason, user.email); return; }

  // Show chat room
  document.getElementById('chat-room').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Set local user label
  document.getElementById('local-label').textContent = user.name;
  if (user.premium) document.getElementById('local-premium-badge')?.classList.remove('hidden');

  const result = await ChatEngine.start({
    onMessage:      _appendMessage,
    onStatusChange: _onChatStatus,
  });

  if (result.error) {
    document.getElementById('chat-room').classList.add('hidden');
    document.body.style.overflow = '';
    UI.toast(result.error, 'error');
  }
}

function stopChat() {
  ChatEngine.stop();
  document.getElementById('chat-room').classList.add('hidden');
  document.body.style.overflow = '';
  document.getElementById('local-premium-badge')?.classList.add('hidden');
}

function nextPartner() {
  _clearMessages();
  ChatEngine.next();
}

function _onChatStatus(status) {
  const overlay = document.getElementById('waiting-overlay');
  if (status === 'searching') {
    overlay?.classList.remove('hidden');
    _clearMessages();
  } else if (status === 'connected') {
    overlay?.classList.add('hidden');
  }
  // Update country pill
  const country = ChatEngine.getCountry();
  const pill = document.getElementById('country-pill-label');
  if (pill) pill.textContent = country === 'any' ? 'Any country' : ChatEngine.countryName(country);
}

function submitChatMessage() {
  const input = document.getElementById('chat-input');
  const text  = input?.value?.trim();
  if (!text) return;
  ChatEngine.sendMessage(text);
  input.value = '';
}

function _appendMessage({ who, text }) {
  const area = document.getElementById('chat-messages');
  if (!area) return;
  const div = document.createElement('div');
  div.className = 'msg msg-' + (who === 'you' ? 'you' : who === 'sys' ? 'sys' : 'them');
  if (who === 'sys') {
    div.innerHTML = `<span class="msg-text">${_escHtml(text)}</span>`;
  } else {
    const author = who === 'you' ? (Auth.current()?.name || 'You') : 'Stranger';
    div.innerHTML = `<span class="msg-author">${_escHtml(author)}:</span><span class="msg-text">${_escHtml(text)}</span>`;
  }
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function _clearMessages() {
  const area = document.getElementById('chat-messages');
  if (area) area.innerHTML = '';
}

// ═══════════════════════════════════════════════════════════
// COUNTRY FILTER
// ═══════════════════════════════════════════════════════════
function showCountryModal() { UI.openModal('country-modal'); }

function applyCountryFilter() {
  const code = UI.getVal('country-select');
  const user = Auth.current();

  if (code !== 'any' && (!user || !user.premium)) {
    UI.closeModal('country-modal');
    setTimeout(() => showPremiumModal(), 100);
    return;
  }

  ChatEngine.setCountry(code);
  UI.closeModal('country-modal');

  const label = code === 'any' ? 'Any country' : ChatEngine.countryName(code);
  const pill  = document.getElementById('country-pill-label');
  if (pill) pill.textContent = label;
  UI.toast('Country filter set: ' + label, 'info');
}

// ═══════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════
function showReportModal() { UI.openModal('report-modal'); }

function submitReport() {
  const reason = UI.getVal('report-reason');
  DB.addReport({
    reporterEmail: Auth.current()?.email || 'anonymous',
    reason,
    sessionId: ChatEngine.getSessionId(),
  });
  UI.closeModal('report-modal');
  UI.toast('Report submitted. Thank you for keeping OmeChat safe.', 'success');

  // After 3 reports for extreme violations, auto-flag
  if (reason === 'underage' || reason === 'nudity') {
    nextPartner();
  }
}

// ═══════════════════════════════════════════════════════════
// MIC / CAM TOGGLE
// ═══════════════════════════════════════════════════════════
function toggleMic() {
  const muted = ChatEngine.toggleMute();
  const btn   = document.getElementById('btn-toggle-mic');
  if (btn) {
    btn.classList.toggle('muted', muted);
    btn.querySelector('i')?.setAttribute('class', muted ? 'fas fa-microphone-slash' : 'fas fa-microphone');
    btn.title = muted ? 'Unmute' : 'Mute';
  }
}

function toggleCam() {
  const off = ChatEngine.toggleCamera();
  const btn = document.getElementById('btn-toggle-cam');
  if (btn) {
    btn.classList.toggle('muted', off);
    btn.querySelector('i')?.setAttribute('class', off ? 'fas fa-video-slash' : 'fas fa-video');
    btn.title = off ? 'Turn camera on' : 'Turn camera off';
  }
}

// ═══════════════════════════════════════════════════════════
// MODAL SWITCH HELPERS (called from HTML)
// ═══════════════════════════════════════════════════════════
function openModal(id)              { UI.openModal(id); }
function closeModal(id)             { UI.closeModal(id); }
function switchModal(from, to)      { UI.switchModal(from, to); }

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
function _escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
