/**
 * OmeChat — Chat Engine (chat-engine.js)
 *
 * Manages the video chat session:
 *  - Camera / microphone access
 *  - WebRTC peer connection setup
 *  - Partner matching (simulation — replace with Socket.io for production)
 *  - In-chat messaging
 *  - Country filter
 *
 * PRODUCTION NOTE:
 *   Real random matching requires a signaling server.
 *   Recommended stack: Node.js + Socket.io + coturn STUN/TURN server.
 *   See README.md for deployment guide.
 */

const ChatEngine = (() => {
  // ─── State ───────────────────────────────────────────────
  let localStream      = null;
  let peerConnection   = null;
  let sessionId        = null;
  let isActive         = false;
  let isMuted          = false;
  let isCamOff         = false;
  let countryFilter    = 'any';
  let matchTimer       = null;
  let onMessageCb      = null;
  let onStatusChangeCb = null;

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  // ─── Public API ──────────────────────────────────────────
  async function start(opts = {}) {
    onMessageCb      = opts.onMessage      ?? (() => {});
    onStatusChangeCb = opts.onStatusChange ?? (() => {});

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied. Please allow access in your browser settings.'
        : 'Could not access camera or microphone: ' + err.message;
      return { error: msg };
    }

    _attachLocalStream();
    isActive  = true;
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    _findPartner();
    return { ok: true };
  }

  function stop() {
    isActive = false;
    clearTimeout(matchTimer);

    localStream?.getTracks().forEach(t => t.stop());
    localStream = null;

    peerConnection?.close();
    peerConnection = null;

    _detachStreams();
  }

  function next() {
    clearTimeout(matchTimer);
    _resetRemote();
    onStatusChangeCb('searching');
    if (isActive) _findPartner();
  }

  function sendMessage(text) {
    if (!text?.trim()) return;
    // In production: send via RTCDataChannel or signaling server
    onMessageCb({ who: 'you', text: text.trim() });
  }

  function toggleMute() {
    if (!localStream) return isMuted;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
    return isMuted;
  }

  function toggleCamera() {
    if (!localStream) return isCamOff;
    isCamOff = !isCamOff;
    localStream.getVideoTracks().forEach(t => { t.enabled = !isCamOff; });
    return isCamOff;
  }

  function setCountry(code) { countryFilter = code || 'any'; }
  function getCountry()     { return countryFilter; }
  function getSessionId()   { return sessionId; }

  // ─── Private helpers ─────────────────────────────────────
  function _attachLocalStream() {
    const vid = document.getElementById('local-video');
    if (vid) { vid.srcObject = localStream; vid.muted = true; }
  }

  function _detachStreams() {
    ['local-video', 'remote-video'].forEach(id => {
      const vid = document.getElementById(id);
      if (vid) { vid.srcObject = null; vid.style.background = ''; }
    });
  }

  function _resetRemote() {
    const vid = document.getElementById('remote-video');
    if (vid) { vid.srcObject = null; }
    document.getElementById('remote-label')?.textContent && (document.getElementById('remote-label').textContent = 'Stranger');
    document.getElementById('remote-premium-badge')?.classList.add('hidden');
    document.getElementById('waiting-overlay')?.classList.remove('hidden');
    document.getElementById('chat-messages')?.childNodes.length > 0 && (document.getElementById('chat-messages').innerHTML = '');
  }

  function _findPartner() {
    onStatusChangeCb('searching');

    // PRODUCTION: replace this setTimeout with actual Socket.io matching
    // socket.emit('find_partner', { country: countryFilter });
    // socket.on('partner_found', (data) => _onPartnerConnected(data));

    const delay = 1500 + Math.random() * 3000;
    matchTimer = setTimeout(() => {
      if (!isActive) return;
      _onPartnerConnected({
        name: 'Stranger',
        country: countryFilter !== 'any' ? countryFilter : _randomCountry(),
        premium: Math.random() > 0.65,
      });
    }, delay);
  }

  function _onPartnerConnected(data) {
    document.getElementById('waiting-overlay')?.classList.add('hidden');

    if (data.name)    _setLabel('remote-label', data.name);
    if (data.premium) document.getElementById('remote-premium-badge')?.classList.remove('hidden');

    const countryLabel = data.country !== 'any' ? ` · ${_countryName(data.country)}` : '';
    onStatusChangeCb('connected');
    onMessageCb({ who: 'sys', text: `Connected with a stranger${countryLabel}. Say hello!` });
  }

  function _setLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function _randomCountry() {
    const countries = ['US','GB','CA','AU','DE','FR','IN','BR','JP','NG','ZA','PH','TR'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  function _countryName(code) {
    const map = {
      US:'United States',GB:'United Kingdom',CA:'Canada',AU:'Australia',
      DE:'Germany',FR:'France',IN:'India',BR:'Brazil',MX:'Mexico',
      JP:'Japan',KR:'South Korea',NG:'Nigeria',ZA:'South Africa',
      PH:'Philippines',ID:'Indonesia',TR:'Turkey',IT:'Italy',ES:'Spain',
      PL:'Poland',RU:'Russia',NL:'Netherlands',SE:'Sweden',NO:'Norway',
    };
    return map[code] || code;
  }

  return {
    start, stop, next,
    sendMessage, toggleMute, toggleCamera,
    setCountry, getCountry, getSessionId,
    countryName: _countryName,
  };
})();
