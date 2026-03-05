// ===== APP.JS - Main app logic, modals, routing =====

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  checkAgeVerified();
  bindNavButtons();
});

function checkAgeVerified() {
  const verified = localStorage.getItem('omechat_age_verified');
  if (!verified) {
    openModal('ageModal');
  }
}

function confirmAge() {
  localStorage.setItem('omechat_age_verified', 'true');
  closeModal('ageModal');
}

function denyAge() {
  closeModal('ageModal');
  openModal('underageModal');
}

function bindNavButtons() {
  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('loginModal'); });
  if (signupBtn) signupBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('signupModal'); });
}

// ---- CHAT START ----
function startChat() {
  if (!currentUser) {
    openModal('loginModal');
    return;
  }
  if (currentUser.banned) {
    showBanModal(currentUser.banReason);
    return;
  }
  document.getElementById('chatRoom').classList.remove('hidden');
  startChatSession();
}

// ---- MODALS ----
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
function switchModal(from, to) {
  closeModal(from);
  openModal(to);
}
function showUnbanModal() {
  closeModal('banModal');
  openModal('unbanModal');
}
function showPremiumModal() {
  if (!currentUser) {
    openModal('loginModal');
    return;
  }
  if (currentUser.premium) {
    alert('You already have Premium!');
    return;
  }
  openModal('premiumModal');
}

// Close modals by clicking overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    // Don't close age modal by clicking overlay
    if (e.target.id === 'ageModal' || e.target.id === 'underageModal' || e.target.id === 'banModal') return;
    e.target.classList.add('hidden');
  }
});

// ---- HAMBURGER ----
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ---- ADMIN HELPERS (browser console access) ----
// Admins can call these from browser console:
window.adminBanUser = function(email, reason) {
  DB.addBan(email, reason, 'admin');
  console.log('Banned:', email, '| Reason:', reason);
};
window.adminUnbanUser = function(email) {
  DB.removeBan(email);
  console.log('Unbanned:', email);
};
window.adminActivatePremium = function(email) {
  DB.updateUser(email, { premium: true, premiumPending: false });
  console.log('Premium activated for:', email);
};
window.adminViewUsers = function() {
  console.table(DB.getUsers());
};
window.adminViewBans = function() {
  console.table(DB.getBans());
};
window.adminExportData = function() {
  const data = {
    users: DB.getUsers(),
    bans: DB.getBans(),
    reports: DB.getReports()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'omechat_data.json';
  a.click();
};
