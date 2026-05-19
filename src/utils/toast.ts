export const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
  // Inject CSS if not exists
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .custom-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,.2);
        max-width: 420px;
        animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        color: #fff;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: opacity 0.3s ease;
      }
      .toast-success { background: #059669; border-left: 4px solid #047857; }
      .toast-error { background: #dc2626; border-left: 4px solid #b91c1c; }
    `;
    document.head.appendChild(style);
  }

  const el = document.createElement('div');
  el.className = `custom-toast toast-${type}`;
  el.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-xl' : 'fa-circle-exclamation text-xl'}"></i>
    <span>${msg}</span>
  `;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
};
