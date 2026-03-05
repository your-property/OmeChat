// ===== STORAGE.JS - Handles all data persistence =====
// In a real deployment, this would be a backend database.
// For this frontend-only version, localStorage simulates the server.

const DB = {
  // ---- USER ACCOUNTS ----
  getUsers() {
    return JSON.parse(localStorage.getItem('omechat_users') || '{}');
  },
  saveUsers(users) {
    localStorage.setItem('omechat_users', JSON.stringify(users));
    // Also save to "login_details.json" simulation log
    localStorage.setItem('omechat_login_log', JSON.stringify(users));
  },
  getUserByEmail(email) {
    const users = this.getUsers();
    return users[email.toLowerCase()] || null;
  },
  createUser(name, email, password, provider = 'email') {
    const users = this.getUsers();
    const key = email.toLowerCase();
    if (users[key]) return { error: 'Email already registered' };
    users[key] = {
      name, email: key, password,
      provider, premium: false,
      banned: false, banReason: '',
      createdAt: new Date().toISOString(),
      unbanPending: false, premiumPending: false
    };
    this.saveUsers(users);
    return { success: true, user: users[key] };
  },
  updateUser(email, updates) {
    const users = this.getUsers();
    const key = email.toLowerCase();
    if (!users[key]) return false;
    users[key] = { ...users[key], ...updates };
    this.saveUsers(users);
    return true;
  },

  // ---- BAN RECORDS ----
  getBans() {
    return JSON.parse(localStorage.getItem('omechat_bans') || '[]');
  },
  addBan(email, reason, bannedBy = 'system') {
    const bans = this.getBans();
    bans.push({
      email: email.toLowerCase(),
      reason, bannedBy,
      bannedAt: new Date().toISOString(),
      status: 'active'
    });
    localStorage.setItem('omechat_bans', JSON.stringify(bans));
    // Update user record
    this.updateUser(email, { banned: true, banReason: reason });
  },
  isEmailBanned(email) {
    const users = this.getUsers();
    const user = users[email.toLowerCase()];
    return user ? user.banned : false;
  },
  getBanReason(email) {
    const users = this.getUsers();
    const user = users[email.toLowerCase()];
    return user ? user.banReason : '';
  },
  removeBan(email) {
    const bans = this.getBans();
    const updated = bans.map(b => b.email === email.toLowerCase() ? {...b, status:'lifted', liftedAt: new Date().toISOString()} : b);
    localStorage.setItem('omechat_bans', JSON.stringify(updated));
    this.updateUser(email, { banned: false, banReason: '', unbanPending: false });
  },

  // ---- REPORTS ----
  getReports() {
    return JSON.parse(localStorage.getItem('omechat_reports') || '[]');
  },
  addReport(reporterEmail, reason, sessionId) {
    const reports = this.getReports();
    reports.push({
      reporter: reporterEmail, reason, sessionId,
      reportedAt: new Date().toISOString(), status: 'pending'
    });
    localStorage.setItem('omechat_reports', JSON.stringify(reports));
  },

  // ---- SESSION ----
  setSession(user) {
    localStorage.setItem('omechat_session', JSON.stringify(user));
  },
  getSession() {
    return JSON.parse(localStorage.getItem('omechat_session') || 'null');
  },
  clearSession() {
    localStorage.removeItem('omechat_session');
  },

  // ---- EXPORT (for admin to download) ----
  exportLoginDetails() {
    return JSON.stringify(this.getUsers(), null, 2);
  },
  exportBanList() {
    return JSON.stringify(this.getBans(), null, 2);
  }
};
