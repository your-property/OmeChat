// ===== AUTH.JS - Authentication logic =====

let currentUser = null;

function initAuth() {
  const session = DB.getSession();
  if (session) {
    // Refresh user data from DB
    const freshUser = DB.getUserByEmail(session.email);
    if (freshUser && !freshUser.banned) {
      currentUser = freshUser;
      updateNavForUser();
    } else if (freshUser && freshUser.banned) {
      DB.clearSession();
      currentUser = null;
    }
  }
}

function updateNavForUser() {
  const navLinks = document.getElementById('navLinks');
  const navUser = document.getElementById('navUser');
  const navUsername = document.getElementById('navUsername');
  const navPremiumBadge = document.getElementById('navPremiumBadge');

  if (currentUser) {
    navLinks.classList.add('hidden');
    navUser.classList.remove('hidden');
    navUsername.textContent = currentUser.name;
    if (currentUser.premium) {
      navPremiumBadge.classList.remove('hidden');
    } else {
      navPremiumBadge.classList.add('hidden');
    }
  } else {
    navLinks.classList.remove('hidden');
    navUser.classList.add('hidden');
  }
}

function emailLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!email || !password) {
    showError(errEl, 'Please fill in all fields.');
    return;
  }

  const user = DB.getUserByEmail(email);
  if (!user) {
    showError(errEl, 'No account found with this email.');
    return;
  }
  if (user.password !== password) {
    showError(errEl, 'Incorrect password.');
    return;
  }
  if (user.banned) {
    closeModal('loginModal');
    showBanModal(user.banReason);
    return;
  }

  loginSuccess(user);
}

function emailSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const errEl = document.getElementById('signupError');
  errEl.classList.add('hidden');

  if (!name || !email || !password) {
    showError(errEl, 'Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showError(errEl, 'Password must be at least 6 characters.');
    return;
  }
  if (!isValidEmail(email)) {
    showError(errEl, 'Please enter a valid email address.');
    return;
  }
  if (DB.isEmailBanned(email)) {
    closeModal('signupModal');
    showBanModal(DB.getBanReason(email));
    return;
  }

  const result = DB.createUser(name, email, password, 'email');
  if (result.error) {
    showError(errEl, result.error);
    return;
  }

  loginSuccess(result.user);
  closeModal('signupModal');
}

function facebookAuth(type) {
  // Simulated Facebook OAuth - in production use Facebook SDK
  const name = prompt('Enter your Facebook display name (simulation):');
  if (!name) return;
  const email = prompt('Enter your Facebook email (simulation):');
  if (!email) return;

  if (DB.isEmailBanned(email)) {
    showBanModal(DB.getBanReason(email));
    return;
  }

  let user = DB.getUserByEmail(email);
  if (!user) {
    const result = DB.createUser(name, email, 'FACEBOOK_AUTH_' + Date.now(), 'facebook');
    user = result.user;
  }

  loginSuccess(user);
  closeModal('loginModal');
  closeModal('signupModal');
}

function loginSuccess(user) {
  currentUser = user;
  DB.setSession(user);
  updateNavForUser();
  closeModal('loginModal');
  closeModal('signupModal');
}

function logout() {
  currentUser = null;
  DB.clearSession();
  updateNavForUser();
  stopChat();
}

function showBanModal(reason) {
  const banReasonEl = document.getElementById('banReason');
  banReasonEl.textContent = 'Ban reason: ' + (reason || 'Violation of Terms of Service');
  openModal('banModal');
}

function submitUnban() {
  const txId = document.getElementById('unbanTxId').value.trim();
  const msgEl = document.getElementById('unbanMsg');
  msgEl.classList.add('hidden');

  if (!txId) {
    msgEl.textContent = 'Please enter your transaction ID.';
    msgEl.classList.remove('hidden');
    msgEl.className = 'error-msg';
    return;
  }

  // Get email from session or ban context
  const session = DB.getSession();
  if (session) {
    DB.updateUser(session.email, { unbanPending: true, unbanTxId: txId });
  }

  msgEl.textContent = 'Submitted! Your unban request is under review. You\'ll be unbanned within 24 hours after payment verification.';
  msgEl.className = 'success-msg';
  msgEl.classList.remove('hidden');
}

function submitPremium() {
  const txId = document.getElementById('premiumTxId').value.trim();
  const msgEl = document.getElementById('premiumMsg');
  msgEl.classList.add('hidden');

  if (!currentUser) {
    msgEl.textContent = 'Please login first.';
    msgEl.className = 'error-msg';
    msgEl.classList.remove('hidden');
    return;
  }
  if (!txId) {
    msgEl.textContent = 'Please enter your transaction ID.';
    msgEl.className = 'error-msg';
    msgEl.classList.remove('hidden');
    return;
  }

  DB.updateUser(currentUser.email, { premiumPending: true, premiumTxId: txId });
  msgEl.textContent = 'Submitted! Premium will be activated within 24 hours after payment verification.';
  msgEl.className = 'success-msg';
  msgEl.classList.remove('hidden');
}

// Helpers
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function showError(el, msg) {
  el.textContent = msg;
  el.className = 'error-msg';
  el.classList.remove('hidden');
}
