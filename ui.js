/**
 * OmeChat — UI Module (ui.js)
 *
 * Centralized UI controller:
 *  - Modal open/close
 *  - Toast notifications
 *  - Navbar state
 *  - Form helpers
 */

const UI = (() => {

  // ─── Modals ───────────────────────────────────────────────
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
  }

  function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 80);
  }

  // ─── Toast ────────────────────────────────────────────────
  function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const colors = { success: '#10b981', error: '#f43f5e', info: '#7c5cfc' };

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]};font-size:1rem;flex-shrink:0"></i><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  }

  // ─── Alert inside modal ───────────────────────────────────
  function showAlert(targetId, message, type = 'error') {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function clearAlert(targetId) {
    const el = document.getElementById(targetId);
    if (el) el.classList.add('hidden');
  }

  // ─── Navbar ───────────────────────────────────────────────
  function updateNav(user) {
    const guestNav   = document.getElementById('nav-guest');
    const userNav    = document.getElementById('nav-user');
    const nameEl     = document.getElementById('nav-username');
    const badgeEl    = document.getElementById('nav-premium-badge');

    if (user) {
      guestNav?.classList.add('hidden');
      userNav?.classList.remove('hidden');
      if (nameEl) nameEl.textContent = user.name;
      if (badgeEl) {
        if (user.premium) badgeEl.classList.remove('hidden');
        else badgeEl.classList.add('hidden');
      }
    } else {
      guestNav?.classList.remove('hidden');
      userNav?.classList.add('hidden');
    }
  }

  // ─── Form utilities ───────────────────────────────────────
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function clearForm(...ids) {
    ids.forEach(id => setVal(id, ''));
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Please wait…';
    } else if (btn.dataset.original) {
      btn.innerHTML = btn.dataset.original;
    }
  }

  // ─── Close on overlay click ───────────────────────────────
  function initOverlayClose(blockedIds = []) {
    document.addEventListener('click', e => {
      if (!e.target.classList.contains('modal-overlay')) return;
      if (blockedIds.includes(e.target.id)) return;
      e.target.classList.add('hidden');
    });
  }

  // ─── Hamburger ────────────────────────────────────────────
  function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('open');
  }

  return {
    openModal, closeModal, closeAllModals, switchModal,
    toast,
    showAlert, clearAlert,
    updateNav,
    getVal, setVal, clearForm, setLoading,
    initOverlayClose,
    toggleMobileMenu,
  };
})();
