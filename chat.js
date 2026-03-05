// ===== CHAT.JS - Video chat logic with WebRTC =====

let localStream = null;
let peerConnection = null;
let selectedCountry = 'any';
let isInChat = false;
let currentSessionId = null;
let nextChatTimer = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

async function startChatSession() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = localStream;

    // Set local user label
    if (currentUser) {
      document.getElementById('localLabel').textContent = currentUser.name;
      if (currentUser.premium) document.getElementById('localPremium').classList.remove('hidden');
    }

    document.getElementById('waitingOverlay').classList.remove('hidden');
    isInChat = true;
    currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2,9);

    // Simulate finding a partner (in production this uses a signaling server)
    simulatePartnerConnect();

  } catch (err) {
    alert('Camera/Microphone access is required to use OmeChat.\n\nError: ' + err.message);
  }
}

function simulatePartnerConnect() {
  // In production: use Socket.io signaling server + WebRTC for real connections
  // This simulation shows the UI flow
  clearTimeout(nextChatTimer);
  nextChatTimer = setTimeout(() => {
    if (!isInChat) return;
    document.getElementById('waitingOverlay').classList.add('hidden');
    const remoteVideo = document.getElementById('remoteVideo');

    // Show a gradient placeholder for demo (real WebRTC connects actual users)
    remoteVideo.style.background = 'linear-gradient(135deg, #1a1a35, #2a1a4a)';

    addSystemMessage('Connected with a stranger' + (selectedCountry !== 'any' ? ' from ' + getCountryName(selectedCountry) : '') + '!');

    // Simulate random premium user
    if (Math.random() > 0.6) {
      document.getElementById('remotePremium').classList.remove('hidden');
    } else {
      document.getElementById('remotePremium').classList.add('hidden');
    }
  }, 2000 + Math.random() * 3000);
}

function nextChat() {
  if (!isInChat) return;
  addSystemMessage('Looking for a new stranger...');
  document.getElementById('waitingOverlay').classList.remove('hidden');
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('remotePremium').classList.add('hidden');
  simulatePartnerConnect();
}

function stopChat() {
  isInChat = false;
  clearTimeout(nextChatTimer);

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  document.getElementById('chatRoom').classList.add('hidden');
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('remoteVideo').srcObject = null;
  document.getElementById('waitingOverlay').classList.remove('hidden');
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  addMessage('you', msg);
  input.value = '';

  // In production: send via signaling server / data channel
}

function addMessage(who, text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg';
  if (who === 'you') {
    div.innerHTML = '<span class="msg-you">You:</span> ' + escapeHtml(text);
  } else if (who === 'stranger') {
    div.innerHTML = '<span class="msg-stranger">Stranger:</span> ' + escapeHtml(text);
  } else {
    div.innerHTML = '<span class="msg-system">' + text + '</span>';
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addSystemMessage(msg) {
  addMessage('system', msg);
}

function reportUser() {
  openModal('reportModal');
}

function submitReport() {
  const reason = document.getElementById('reportReason').value;
  if (currentUser) {
    DB.addReport(currentUser.email, reason, currentSessionId);
  }
  closeModal('reportModal');
  addSystemMessage('Report submitted. Thank you for helping keep OmeChat safe.');

  // If severe report - auto-ban simulation (in production: reviewed by mod)
  if (reason === 'underage' || reason === 'nudity') {
    // Flag for review - ban happens after mod review
    addSystemMessage('Our moderation team has been alerted.');
  }
}

function showCountryModal() {
  openModal('countryModal');
}

function applyCountry() {
  const select = document.getElementById('countrySelect');
  selectedCountry = select.value;
  const bar = document.getElementById('countryFilterBar');

  if (selectedCountry !== 'any') {
    bar.textContent = 'Country filter: ' + getCountryName(selectedCountry) + ' | ' + (currentUser && currentUser.premium ? 'Active' : 'Premium required for guaranteed matching');
  } else {
    bar.textContent = '';
  }

  if (selectedCountry !== 'any' && (!currentUser || !currentUser.premium)) {
    closeModal('countryModal');
    setTimeout(() => showPremiumModal(), 300);
    return;
  }
  closeModal('countryModal');
}

function getCountryName(code) {
  const map = { US:'United States', GB:'United Kingdom', CA:'Canada', AU:'Australia', DE:'Germany', FR:'France', IN:'India', BR:'Brazil', MX:'Mexico', JP:'Japan', NG:'Nigeria', ZA:'South Africa', PH:'Philippines', TR:'Turkey', IT:'Italy', ES:'Spain', RU:'Russia', KR:'South Korea', ID:'Indonesia', PL:'Poland' };
  return map[code] || code;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
