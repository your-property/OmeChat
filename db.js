/**
 * OmeChat — Database Module (db.js)
 *
 * Handles all persistent data operations.
 * Uses localStorage as the data store for this frontend-only version.
 * In production: replace with REST API calls to your backend.
 *
 * Data stored:
 *  - omechat:users      → { email: UserObject }
 *  - omechat:bans       → BanRecord[]
 *  - omechat:reports    → ReportRecord[]
 *  - omechat:session    → UserObject | null
 *  - omechat:age_ok     → "1"
 */

const DB = (() => {
  const KEY = {
    USERS:   'omechat:users',
    BANS:    'omechat:bans',
    REPORTS: 'omechat:reports',
    SESSION: 'omechat:session',
    AGE:     'omechat:age_ok',
  };

  // ─── Low-level helpers ────────────────────────────────────
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ─── Users ────────────────────────────────────────────────
  function getUsers() { return read(KEY.USERS, {}); }
  function saveUsers(u) { write(KEY.USERS, u); }

  function getUserByEmail(email) {
    return getUsers()[email.toLowerCase()] ?? null;
  }

  function createUser({ name, email, password, provider = 'email' }) {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return { error: 'Email already registered.' };

    const user = {
      id:             'u_' + Date.now(),
      name:           name.trim(),
      email:          key,
      password,
      provider,
      premium:        false,
      premiumPending: false,
      premiumTxId:    null,
      banned:         false,
      banReason:      '',
      unbanPending:   false,
      unbanTxId:      null,
      createdAt:      new Date().toISOString(),
    };

    users[key] = user;
    saveUsers(users);
    return { ok: true, user };
  }

  function updateUser(email, patch) {
    const users = getUsers();
    const key = email.toLowerCase();
    if (!users[key]) return false;
    users[key] = { ...users[key], ...patch };
    saveUsers(users);
    return true;
  }

  function deleteUser(email) {
    const users = getUsers();
    delete users[email.toLowerCase()];
    saveUsers(users);
  }

  // ─── Bans ─────────────────────────────────────────────────
  function getBans() { return read(KEY.BANS, []); }

  function banUser(email, reason, bannedBy = 'admin') {
    const bans = getBans();
    // Mark any existing active ban for this email as superseded
    bans.forEach(b => { if (b.email === email.toLowerCase() && b.status === 'active') b.status = 'superseded'; });
    bans.push({
      id:       'ban_' + Date.now(),
      email:    email.toLowerCase(),
      reason,
      bannedBy,
      bannedAt: new Date().toISOString(),
      status:   'active',
    });
    write(KEY.BANS, bans);
    updateUser(email, { banned: true, banReason: reason, unbanPending: false, unbanTxId: null });
  }

  function unbanUser(email) {
    const bans = getBans();
    bans.forEach(b => { if (b.email === email.toLowerCase() && b.status === 'active') { b.status = 'lifted'; b.liftedAt = new Date().toISOString(); } });
    write(KEY.BANS, bans);
    updateUser(email, { banned: false, banReason: '', unbanPending: false, unbanTxId: null });
  }

  function isEmailBanned(email) {
    const user = getUserByEmail(email);
    return user ? user.banned : false;
  }

  function getBanReason(email) {
    const user = getUserByEmail(email);
    return user?.banReason ?? '';
  }

  // ─── Reports ──────────────────────────────────────────────
  function getReports() { return read(KEY.REPORTS, []); }

  function addReport({ reporterEmail, reason, sessionId }) {
    const reports = getReports();
    reports.push({
      id:          'rpt_' + Date.now(),
      reporter:    reporterEmail || 'anonymous',
      reason,
      sessionId,
      reportedAt:  new Date().toISOString(),
      status:      'pending',
    });
    write(KEY.REPORTS, reports);
  }

  function resolveReport(id, resolution) {
    const reports = getReports();
    const r = reports.find(x => x.id === id);
    if (r) { r.status = resolution; r.resolvedAt = new Date().toISOString(); }
    write(KEY.REPORTS, reports);
  }

  // ─── Session ──────────────────────────────────────────────
  function setSession(user) { write(KEY.SESSION, user); }
  function getSession()     { return read(KEY.SESSION, null); }
  function clearSession()   { localStorage.removeItem(KEY.SESSION); }

  // ─── Age gate ─────────────────────────────────────────────
  function isAgeVerified()  { return localStorage.getItem(KEY.AGE) === '1'; }
  function setAgeVerified() { localStorage.setItem(KEY.AGE, '1'); }

  // ─── Export helpers ───────────────────────────────────────
  function exportJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
    a.click();
  }

  function exportUsers()   { exportJSON(getUsers(), 'login_details.json'); }
  function exportBans()    { exportJSON(getBans(),  'ban_list.json'); }
  function exportAll()     { exportJSON({ users: getUsers(), bans: getBans(), reports: getReports() }, 'omechat_full_export.json'); }

  // ─── Stats ────────────────────────────────────────────────
  function getStats() {
    const users   = Object.values(getUsers());
    const bans    = getBans();
    const reports = getReports();
    return {
      totalUsers:      users.length,
      premiumUsers:    users.filter(u => u.premium).length,
      bannedUsers:     users.filter(u => u.banned).length,
      pendingUnbans:   users.filter(u => u.unbanPending).length,
      pendingPremiums: users.filter(u => u.premiumPending).length,
      totalReports:    reports.length,
      pendingReports:  reports.filter(r => r.status === 'pending').length,
      totalBanEvents:  bans.length,
    };
  }

  // Public API
  return {
    getUserByEmail, createUser, updateUser, deleteUser, getUsers,
    banUser, unbanUser, isEmailBanned, getBanReason, getBans,
    addReport, getReports, resolveReport,
    setSession, getSession, clearSession,
    isAgeVerified, setAgeVerified,
    exportUsers, exportBans, exportAll,
    getStats,
  };
})();
