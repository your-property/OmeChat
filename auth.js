/**
 * OmeChat — Auth Module (auth.js)
 *
 * Manages user authentication:
 *  - Email signup / login
 *  - Facebook OAuth (simulated; swap for real FB SDK in production)
 *  - Session persistence
 *  - Ban checks on login
 */

const Auth = (() => {
  let _currentUser = null;

  // ─── Getters ─────────────────────────────────────────────
  function current() { return _currentUser; }
  function isLoggedIn() { return !!_currentUser; }

  // ─── Initialise from stored session ──────────────────────
  function init() {
    const session = DB.getSession();
    if (!session) return;

    // Always re-read from DB so banned status is current
    const fresh = DB.getUserByEmail(session.email);
    if (fresh && !fresh.banned) {
      _currentUser = fresh;
    } else {
      DB.clearSession();
    }
  }

  // ─── Email Login ─────────────────────────────────────────
  function loginWithEmail(email, password) {
    if (!email || !password) return { error: 'Please fill in all fields.' };

    const user = DB.getUserByEmail(email);
    if (!user)             return { error: 'No account found with that email.' };
    if (user.password !== password) return { error: 'Incorrect password.' };
    if (user.banned)       return { error: 'banned', reason: user.banReason };

    return _setSession(user);
  }

  // ─── Email Signup ─────────────────────────────────────────
  function signupWithEmail(name, email, password) {
    if (!name || !email || !password) return { error: 'Please fill in all fields.' };
    if (!isValidEmail(email))         return { error: 'Invalid email address.' };
    if (password.length < 6)          return { error: 'Password must be at least 6 characters.' };

    // Check if the email itself is banned (even without an account)
    if (DB.isEmailBanned(email)) return { error: 'banned', reason: DB.getBanReason(email) };

    const result = DB.createUser({ name, email, password, provider: 'email' });
    if (result.error) return { error: result.error };

    return _setSession(result.user);
  }

  // ─── Facebook OAuth ───────────────────────────────────────
  // In production: integrate the real Facebook JavaScript SDK.
  // Replace this function body with:
  //   FB.login(response => { ... handle response.authResponse ... })
  function loginWithFacebook() {
    // Simulation prompt — remove this and use real FB SDK
    const name  = window.prompt('Facebook display name (demo simulation):');
    if (!name) return { error: 'Cancelled.' };
    const email = window.prompt('Facebook email (demo simulation):');
    if (!email) return { error: 'Cancelled.' };

    if (!isValidEmail(email)) return { error: 'Invalid email returned from Facebook.' };
    if (DB.isEmailBanned(email)) return { error: 'banned', reason: DB.getBanReason(email) };

    let user = DB.getUserByEmail(email);
    if (!user) {
      const result = DB.createUser({ name, email, password: 'FB_OAUTH_' + Date.now(), provider: 'facebook' });
      if (result.error) return { error: result.error };
      user = result.user;
    } else if (user.banned) {
      return { error: 'banned', reason: user.banReason };
    }

    return _setSession(user);
  }

  // ─── Logout ───────────────────────────────────────────────
  function logout() {
    _currentUser = null;
    DB.clearSession();
  }

  // ─── Premium / Unban requests ─────────────────────────────
  function requestPremium(txId) {
    if (!_currentUser) return { error: 'Not logged in.' };
    if (!txId?.trim()) return { error: 'Please enter your transaction ID.' };
    DB.updateUser(_currentUser.email, { premiumPending: true, premiumTxId: txId.trim() });
    return { ok: true };
  }

  function requestUnban(email, txId) {
    if (!email || !txId?.trim()) return { error: 'Email and transaction ID required.' };
    DB.updateUser(email, { unbanPending: true, unbanTxId: txId.trim() });
    return { ok: true };
  }

  // ─── Private helpers ──────────────────────────────────────
  function _setSession(user) {
    _currentUser = user;
    DB.setSession(user);
    return { ok: true, user };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  return {
    init,
    current,
    isLoggedIn,
    loginWithEmail,
    signupWithEmail,
    loginWithFacebook,
    logout,
    requestPremium,
    requestUnban,
  };
})();
