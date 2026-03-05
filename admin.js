/**
 * OmeChat — Admin Controller (admin.js)
 *
 * Powers the admin dashboard:
 *  - Login gate
 *  - Tab switching
 *  - User management (ban, unban, premium)
 *  - Stats display
 *  - Data export
 */

// ─── Admin credentials ─────────────────────────────────────
// IMPORTANT: Change this before deploying to production!
// In production: use server-side authentication, not hardcoded credentials.
const ADMIN = { username: 'admin', password: 'omechat2025!' };

let _adminLoggedIn = false;
let _activeTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in this session
  if (sessionStorage.getItem('omechat:admin') === '1') {
    _showDashboard();
  }
  // Enter key on login form
  document.getElementById('admin-login-form')?.addEventListener('submit', e => { e.preventDefault(); adminLogin(); });
});

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
function adminLogin() {
  const u = document.getElementById('admin-user')?.value?.trim();
  const p = document.getElementById('admin-pass')?.value;
  const err = document.getElementById('admin-login-err');

  if (u === ADMIN.username && p === ADMIN.password) {
    sessionStorage.setItem('omechat:admin', '1');
    err?.classList.add('hidden');
    _showDashboard();
  } else {
    if (err) { err.textContent = 'Invalid username or password.'; err.classList.remove('hidden'); }
  }
}

function adminLogout() {
  sessionStorage.removeItem('omechat:admin');
  document.getElementById('admin-login-screen').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
}

function _showDashboard() {
  document.getElementById('admin-login-screen')?.classList.add('hidden');
  document.getElementById('admin-dashboard')?.classList.remove('hidden');
  switchAdminTab('overview');
}

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════
function switchAdminTab(tab) {
  _activeTab = tab;
  // Update sidebar links
  document.querySelectorAll('.sidebar-link').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  // Show correct panel
  document.querySelectorAll('.admin-panel').forEach(el => {
    el.classList.toggle('active', el.id === 'panel-' + tab);
  });
  // Load data for the tab
  if (tab === 'overview') renderOverview();
  if (tab === 'users')    renderUsers();
  if (tab === 'bans')     renderBans();
  if (tab === 'reports')  renderReports();
}

// ═══════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════
function renderOverview() {
  const s = DB.getStats();
  _setText('stat-total-users',   s.totalUsers);
  _setText('stat-premium-users', s.premiumUsers);
  _setText('stat-banned-users',  s.bannedUsers);
  _setText('stat-pending',       s.pendingUnbans + s.pendingPremiums);
  _setText('stat-reports',       s.pendingReports);
}

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════
function renderUsers(filter = '') {
  const users  = Object.values(DB.getUsers());
  const tbody  = document.getElementById('users-tbody');
  if (!tbody) return;

  const filtered = filter
    ? users.filter(u => u.email.includes(filter) || u.name.toLowerCase().includes(filter.toLowerCase()))
    : users;

  if (!filtered.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div style="font-weight:600">${_esc(u.name)}</div>
        <div style="font-size:0.78rem;color:var(--c-muted)">${_esc(u.email)}</div>
      </td>
      <td><span class="badge badge-${u.provider === 'facebook' ? 'pending' : 'active'}">${u.provider}</span></td>
      <td>${u.banned ? `<span class="badge badge-banned">Banned</span>` : `<span class="badge badge-active">Active</span>`}</td>
      <td>
        ${u.premium
          ? `<span class="badge badge-premium">⭐ Premium</span>`
          : u.premiumPending
          ? `<span class="badge badge-pending" title="TX: ${_esc(u.premiumTxId||'')}">Pending $25</span>`
          : '—'}
      </td>
      <td style="font-size:0.8rem;color:var(--c-muted)">${_formatDate(u.createdAt)}</td>
      <td>
        ${u.unbanPending ? `<span class="badge badge-pending" style="font-size:0.7rem" title="TX: ${_esc(u.unbanTxId||'')}">Unban pending</span>` : ''}
      </td>
      <td>
        <div class="table-actions">
          ${!u.banned
            ? `<button class="action-btn action-ban" onclick="quickBan('${_esc(u.email)}')">Ban</button>`
            : `<button class="action-btn action-unban" onclick="quickUnban('${_esc(u.email)}')">Unban</button>`}
          ${!u.premium
            ? `<button class="action-btn action-premium" onclick="quickPremium('${_esc(u.email)}')">Premium</button>`
            : `<button class="action-btn action-revoke" onclick="quickRevokePremium('${_esc(u.email)}')">Revoke</button>`}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterUsers() {
  const q = document.getElementById('user-search')?.value || '';
  renderUsers(q);
}

function quickBan(email) {
  const reasons = [
    'Inappropriate behavior',
    'Nudity / Sexual content',
    'Harassment / Bullying',
    'Underage user',
    'Spam / Bot',
    'Terms of Service violation',
  ];
  const reason = window.prompt(
    `Ban reason for ${email}?\n\n` + reasons.map((r,i) => `${i+1}. ${r}`).join('\n') + '\n\nType or paste reason:'
  );
  if (!reason) return;
  DB.banUser(email, reason, 'admin');
  renderUsers();
  renderOverview();
  _adminToast(`Banned: ${email}`, 'ban');
}

function quickUnban(email) {
  if (!confirm(`Unban ${email}? This will restore their access.`)) return;
  DB.unbanUser(email);
  renderUsers();
  renderOverview();
  _adminToast(`Unbanned: ${email}`, 'ok');
}

function quickPremium(email) {
  if (!confirm(`Activate Premium for ${email}?`)) return;
  DB.updateUser(email, { premium: true, premiumPending: false });
  renderUsers();
  renderOverview();
  _adminToast(`Premium activated for: ${email}`, 'ok');
}

function quickRevokePremium(email) {
  if (!confirm(`Revoke Premium from ${email}?`)) return;
  DB.updateUser(email, { premium: false });
  renderUsers();
  renderOverview();
  _adminToast(`Premium revoked for: ${email}`, 'ban');
}

// ─── Ban form
function doBanUser() {
  const email  = document.getElementById('ban-email')?.value?.trim();
  const reason = document.getElementById('ban-reason-select')?.value;
  if (!email) { _adminToast('Enter an email', 'ban'); return; }
  DB.banUser(email, reason, 'admin');
  renderOverview();
  _adminToast(`Banned: ${email}`, 'ban');
  if (document.getElementById('ban-email')) document.getElementById('ban-email').value = '';
}

function doUnbanUser() {
  const email = document.getElementById('unban-email-admin')?.value?.trim();
  if (!email) { _adminToast('Enter an email', 'ban'); return; }
  DB.unbanUser(email);
  renderOverview();
  _adminToast(`Unbanned: ${email}`, 'ok');
  if (document.getElementById('unban-email-admin')) document.getElementById('unban-email-admin').value = '';
}

function doActivatePremium() {
  const email = document.getElementById('premium-email-admin')?.value?.trim();
  if (!email) { _adminToast('Enter an email', 'ban'); return; }
  DB.updateUser(email, { premium: true, premiumPending: false });
  renderOverview();
  _adminToast(`Premium activated: ${email}`, 'ok');
  if (document.getElementById('premium-email-admin')) document.getElementById('premium-email-admin').value = '';
}

// ═══════════════════════════════════════════════════════════
// BANS
// ═══════════════════════════════════════════════════════════
function renderBans() {
  const bans  = DB.getBans();
  const users = DB.getUsers();
  const tbody = document.getElementById('bans-tbody');
  if (!tbody) return;

  if (!bans.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No ban records</td></tr>';
    return;
  }

  tbody.innerHTML = [...bans].reverse().map(b => {
    const user = users[b.email];
    return `
    <tr>
      <td style="font-size:0.88rem">${_esc(b.email)}</td>
      <td>${_esc(b.reason)}</td>
      <td style="font-size:0.8rem;color:var(--c-muted)">${_esc(b.bannedBy)}</td>
      <td style="font-size:0.8rem;color:var(--c-muted)">${_formatDate(b.bannedAt)}</td>
      <td>${b.status === 'active' ? `<span class="badge badge-banned">Active</span>` : `<span class="badge badge-active">${b.status}</span>`}</td>
      <td>${user?.unbanTxId ? `<span style="font-family:var(--f-mono);font-size:0.75rem;color:var(--c-violet-light)">${_esc(user.unbanTxId)}</span>` : '—'}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════
function renderReports() {
  const reports = DB.getReports();
  const tbody   = document.getElementById('reports-tbody');
  if (!tbody) return;

  if (!reports.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No reports</td></tr>';
    return;
  }

  tbody.innerHTML = [...reports].reverse().map(r => `
    <tr>
      <td style="font-size:0.85rem">${_esc(r.reporter)}</td>
      <td>${_esc(r.reason)}</td>
      <td style="font-family:var(--f-mono);font-size:0.72rem;color:var(--c-muted)">${_esc(r.sessionId||'')}</td>
      <td style="font-size:0.8rem;color:var(--c-muted)">${_formatDate(r.reportedAt)}</td>
      <td>
        ${r.status === 'pending'
          ? `<div class="table-actions">
               <span class="badge badge-pending">Pending</span>
               <button class="action-btn action-ban" onclick="resolveReport('${r.id}','actioned')">Action</button>
               <button class="action-btn action-revoke" onclick="resolveReport('${r.id}','dismissed')">Dismiss</button>
             </div>`
          : `<span class="badge badge-active">${_esc(r.status)}</span>`}
      </td>
    </tr>
  `).join('');
}

function resolveReport(id, resolution) {
  DB.resolveReport(id, resolution);
  renderReports();
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
function exportData(type) {
  if (type === 'users')   DB.exportUsers();
  else if (type === 'bans') DB.exportBans();
  else                    DB.exportAll();
  _adminToast('Export started', 'ok');
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function _esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _adminToast(msg, type) {
  const area = document.getElementById('admin-toast-area');
  if (!area) return;
  const el = document.createElement('div');
  el.className = 'toast toast-' + (type === 'ok' ? 'success' : 'error');
  el.innerHTML = `<i class="fas ${type === 'ok' ? 'fa-check-circle' : 'fa-ban'}" style="color:${type === 'ok' ? 'var(--c-green)' : 'var(--c-red)'}"></i><span>${msg}</span>`;
  area.appendChild(el);
  setTimeout(() => { el.classList.add('removing'); el.addEventListener('animationend', () => el.remove()); }, 3000);
}
