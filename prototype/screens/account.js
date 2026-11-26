/* screens/account.js — Tab Tài khoản, thông báo, cài đặt, thông tin nhà thuốc */
App.css(`
.ac-profile { display: flex; flex-direction: column; align-items: center; text-align: center; padding: calc(var(--sat) + 16px) 20px 20px; }
.ac-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--teal-100); color: var(--teal-800); display: grid; place-items: center; font-size: 26px; font-weight: 700; margin-bottom: 12px; }
.ac-name { font-size: 22px; font-weight: 700; color: var(--ink); line-height: 1.25; overflow-wrap: anywhere; }
.ac-role { font-size: 14px; color: var(--ink-2); margin-top: 4px; }
.ac-session-count { min-width: 3ch; }

.ac-switch {
  position: relative;
  width: 51px;
  height: 31px;
  border-radius: 16px;
  background: var(--line);
  transition: background .25s var(--ease);
  flex: none;
  cursor: pointer;
  padding: 2px;
  display: block;
}
.ac-switch.on { background: var(--teal-600); }
.ac-switch:disabled { opacity: .45; cursor: not-allowed; pointer-events: none; }
#acAppLockRow[aria-disabled="true"] { opacity: .45; cursor: not-allowed; pointer-events: none; }
.ac-knob {
  display: block;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: var(--card);
  box-shadow: var(--gl-shadow);
  transition: transform .3s var(--spring);
}
.ac-switch.on .ac-knob { transform: translateX(20px); }

.ac-notif-card { margin: 0 16px; overflow: hidden; }
.ac-notif-row { transition: background .3s var(--ease); }
.ac-notif-row.unread { background: var(--teal-50); }
.ac-notif-row.unread .row-title { font-weight: 600; }
.ac-notif-row:not(.unread) .row-title { font-weight: 500; }
.ac-notif-time { font-size: 13px; color: var(--ink-3); font-weight: 500; }
.ac-notif-row:not(.tap) { cursor: default; }

.ac-head-btn { font-size: 14px; font-weight: 600; color: var(--teal-700); padding: 4px 0; background: none; border: none; cursor: pointer; }

.ac-info-card { margin: 16px 16px 0; padding: 4px 16px; }
.ac-info-item { padding: 14px 0; }
.ac-info-item + .ac-info-item { border-top: 1px solid var(--line); }
.ac-info-label { font-size: 13px; color: var(--ink-3); line-height: 1.4; margin-bottom: 4px; }
.ac-info-val { font-size: 15px; font-weight: 600; color: var(--ink); line-height: 1.4; }
.ac-info-wrap { white-space: normal; word-break: break-word; }
.ac-store-note { font-size: 13px; color: var(--ink-3); text-align: center; margin-top: 20px; padding: 0 20px; line-height: 1.4; }
.ac-detail-row { width: 100%; grid-template-columns: 1fr auto; text-align: left; }
.ac-detail-row + .ac-detail-row::before { left: 16px; }
.ac-store-section .row { min-height: 72px; cursor: default; }
.ac-bottom { padding-bottom: var(--sab); }
.ac-expiry-options { margin-top: 20px; }
.ac-expiry-options button { display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; }
.ac-expiry-options .spin { width: 12px; height: 12px; }
.ac-push-row { min-height: 84px; cursor: default; }
.ac-push-btn { height: 34px; padding: 0 16px; font-size: 14px; border-radius: 17px; white-space: nowrap; flex: none; }
.ac-push-off { font-size: 14px; font-weight: 600; color: var(--teal-700); padding: 6px 4px; background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.ac-push-off:disabled { color: var(--ink-3); cursor: default; pointer-events: none; }
`);

(function () {
  if (typeof API === 'undefined') {
    window.API = {
      me: () => ({ name: DATA.owner.name, role: 'manager' }),
      bio: { enabled: () => false, set: () => {} },
      webSessions: { list: async () => ({ ok: true, sessions: [] }) },
      push: {
        status: async () => 'off',
        enable: async () => ({ ok: true }),
        disable: async () => ({ ok: true }),
        prefs: async () => ({ ok: true, prefs: { revenue: true, debt: true, lowStock: true, expiring: true, expiryDays: 30 } }),
        onOpen: () => {},
      },
      notifications: {
        list: async () => ({ ok: true, items: [] }),
        read: async () => ({ ok: true }),
      },
    };
  }

  App.openNotif = (kind) => {
    if (kind === 'revenue') App.tab('revenue');
    else if (kind === 'stock') App.go('lowStock');
    else if (kind === 'expiry') App.go('expiring');
    else if (kind === 'debt') App.go('payables');
    else App.go('notifications');
  };

  const NOTIF_TARGET = {
    revenue: 'revenue',
    stock: 'lowStock',
    expiry: 'expiring',
    debt: 'payables',
  };

  function isInApp() {
    const cur = App.current();
    const me = API.me && API.me();
    if (!me || !cur) return false;
    if (['splash', 'login', 'otp', 'bioSetup', 'lock'].includes(cur.name)) return false;
    if (cur.name === 'password' && cur.p?.mode !== 'change') return false;
    return true;
  }

  let pendingOpenTimer = null;
  function openNotifWhenReady(kind, tries = 12) {
    clearTimeout(pendingOpenTimer);
    if (!isInApp()) return;
    const target = NOTIF_TARGET[kind] || 'notifications';
    App.openNotif(kind);
    if (App.current()?.name !== target && tries > 0) {
      pendingOpenTimer = setTimeout(() => openNotifWhenReady(kind, tries - 1), 80);
    }
  }

  if (API.push && API.push.onOpen) {
    API.push.onOpen((kind) => {
      openNotifWhenReady(kind);
    });
  }

  const EXPIRY_OPTIONS = [15, 30, 60, 90];

  function showSupportSheet() {
    App.sheet(`
      <h3>Hỗ trợ kỹ thuật</h3>
      <p>Tổng đài dược sĩ và kỹ thuật MediPOS luôn sẵn sàng hỗ trợ nhà thuốc.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px">
        <a class="btn btn-primary block tap" id="acCallAction" href="tel:19006868" style="text-decoration:none">${App.icon('phone', 20)}Gọi 1900 6868</a>
        <button class="btn btn-secondary block tap" id="acZaloAction">Nhắn Zalo</button>
      </div>
    `, {
      onMount(sheetEl, close) {
        sheetEl.querySelector('#acCallAction')?.addEventListener('click', () => {
          close();
        });
        sheetEl.querySelector('#acZaloAction')?.addEventListener('click', () => {
          close();
          App.toast('Đang mở Zalo MediPOS', 'check');
        });
      },
    });
  }

  function showLogoutSheet() {
    App.sheet(`
      <h3>Đăng xuất khỏi điện thoại này?</h3>
      <p>Các máy tính đang đăng nhập web vẫn mở. Muốn tắt hết thì đăng xuất chúng ở Phiên web trước.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px">
        <button class="btn btn-danger block tap" id="acLogoutConfirm">Đăng xuất</button>
        <button class="btn btn-secondary block tap" id="acLogoutCancel" data-close>Ở lại</button>
      </div>
    `, {
      onMount(sheetEl, close) {
        const cancelBtn = sheetEl.querySelector('#acLogoutCancel');
        let loggingOut = false;
        sheetEl.querySelector('#acLogoutConfirm')?.addEventListener('click', async (e) => {
          if (loggingOut) return;
          loggingOut = true;
          App.busy(e.currentTarget, 'Đang đăng xuất...');
          if (cancelBtn) cancelBtn.disabled = true;
          await API.signOut();
          close();
          App.reset('login');
        });
      },
    });
  }

  const ROLE_LABEL = { admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên' };

  // 1. Màn Tài khoản
  App.screen('account', {
    tab: 'account',
    render: () => {
      const me = API.me();
      const name = me?.name?.trim() || '';
      const words = name.normalize().split(/\s+/);
      const initials = (words[0].charAt(0) + (words.length > 1 ? words.at(-1).charAt(0) : '')).toLocaleUpperCase('vi');
      const isAdmin = me?.role === 'admin';
      const on = API.bio.enabled();
      const lockOn = on && localStorage.getItem('medipos.applock') === '1';

      return `
        ${me ? `<div class="ac-profile">
          <div class="ac-avatar">${App.esc(initials)}</div>
          <div class="ac-name">${App.esc(name)}</div>
          <div class="ac-role">${App.esc(ROLE_LABEL[me.role])}, ${App.esc(DATA.store.name)}</div>
        </div>` : ''}

        ${isAdmin ? `
          <div class="card" style="margin:8px 16px 0">
            <div class="row tap" data-go="accounts">
              <div class="tile">${App.icon('users', 20)}</div>
              <div class="row-main"><div class="row-title ell">Quản lý tài khoản</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
          </div>` : ''}
        <div class="section" style="margin-top:8px">
          <div class="section-head"><h2 style="font-size:15px">Bảo mật</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" id="acFaceIdRow">
              <div class="tile">${App.icon('faceid', 20)}</div>
              <div class="row-main"><div class="row-title">Face ID</div></div>
              <div class="row-end">
                <button class="ac-switch${on ? ' on' : ''}" id="acFaceIdBtn" type="button" role="switch" aria-checked="${on}" aria-label="Face ID"><span class="ac-knob"></span></button>
              </div>
            </div>
            <div class="row${on ? ' tap' : ''}" id="acAppLockRow"${on ? '' : ' aria-disabled="true"'}>
              <div class="tile">${App.icon('shield', 20)}</div>
              <div class="row-main"><div class="row-title">Khoá app khi mở</div></div>
              <div class="row-end">
                <button class="ac-switch${lockOn ? ' on' : ''}" id="acAppLockBtn" type="button" role="switch" aria-checked="${lockOn}" aria-label="Khoá app khi mở"${on ? '' : ' disabled aria-disabled="true"'}><span class="ac-knob"></span></button>
              </div>
            </div>
            <div class="row tap" data-go="password" data-p='{"mode":"change"}'>
              <div class="tile">${App.icon('lock', 20)}</div>
              <div class="row-main"><div class="row-title">Đổi mật khẩu</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
            <div class="row tap" data-go="webSessions">
              <div class="tile">${App.icon('monitor', 20)}</div>
              <div class="row-main"><div class="row-title">Phiên web đang mở</div></div>
              <div class="row-end num"><span class="ac-session-count"></span>${App.icon('chev', 20)}</div>
            </div>
          </div>
        </div>

        <div class="section" style="margin-top:20px">
          <div class="section-head"><h2 style="font-size:15px">Cửa hàng</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" data-go="storeInfo">
              <div class="tile">${App.icon('pin', 20)}</div>
              <div class="row-main"><div class="row-title">Thông tin nhà thuốc</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
            <div class="row tap" data-go="notifSettings">
              <div class="tile">${App.icon('bell', 20)}</div>
              <div class="row-main"><div class="row-title">Cài đặt thông báo</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
          </div>
        </div>

        <div class="section" style="margin-top:20px">
          <div class="section-head"><h2 style="font-size:15px">Hỗ trợ</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" id="acSupportRow">
              <div class="tile">${App.icon('phone', 20)}</div>
              <div class="row-main"><div class="row-title">Gọi hỗ trợ 1900 6868</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
            <div class="row" style="cursor:default">
              <div class="tile">${App.icon('info', 20)}</div>
              <div class="row-main"><div class="row-title">Phiên bản</div></div>
              <div class="row-end" style="color:var(--ink-3);font-weight:500">0.1 (prototype)</div>
            </div>
          </div>
        </div>

        <div style="margin:28px 16px 20px">
          <button class="btn btn-danger block tap" id="acLogoutBtn">Đăng xuất khỏi điện thoại</button>
        </div>
      `;
    },
    mount: (el) => {
      if (el._mounted) return;
      el._mounted = true;

      const sessionCount = el.querySelector('.ac-session-count');
      if (API.me()) {
        API.webSessions.list().then((r) => {
          if (el.isConnected && r.ok && r.sessions.length) sessionCount.textContent = r.sessions.length;
        });
      }

      const fidBtn = el.querySelector('#acFaceIdBtn');
      const fidRow = el.querySelector('#acFaceIdRow');
      const lockBtn = el.querySelector('#acAppLockBtn');
      const lockRow = el.querySelector('#acAppLockRow');

      const updateAppLockUI = (bioEnabled) => {
        if (!lockRow || !lockBtn) return;
        if (bioEnabled) {
          lockRow.removeAttribute('aria-disabled');
          lockRow.classList.add('tap');
          lockBtn.removeAttribute('disabled');
          lockBtn.removeAttribute('aria-disabled');
        } else {
          lockRow.setAttribute('aria-disabled', 'true');
          lockRow.classList.remove('tap');
          lockBtn.setAttribute('disabled', '');
          lockBtn.setAttribute('aria-disabled', 'true');
        }
        lockBtn.classList.remove('on');
        lockBtn.setAttribute('aria-checked', 'false');
      };

      if (fidRow && fidBtn) {
        let checking = false;
        fidRow.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (checking) return;
          const on = API.bio.enabled();
          checking = true;
          try {
            const r = on ? await API.bio.disable() : await API.bio.enable();
            if (r.ok) localStorage.removeItem('medipos.applock');
            if (!el.isConnected || App.current()?.el !== el) return;
            if (r.ok) {
              const nowOn = !on;
              fidBtn.classList.toggle('on', nowOn);
              fidBtn.setAttribute('aria-checked', String(nowOn));
              updateAppLockUI(nowOn);
            } else if (!r.cancel) {
              App.toast(r.error, 'alert');
            }
          } finally {
            checking = false;
          }
        });
      }

      if (lockRow && lockBtn) {
        let lockBusy = false;
        lockRow.addEventListener('click', (e) => {
          e.stopPropagation();
          if (lockBusy) return;
          if (!API.bio.enabled()) return;
          lockBusy = true;
          try {
            const curOn = localStorage.getItem('medipos.applock') === '1';
            const nextOn = !curOn;
            if (nextOn) {
              localStorage.setItem('medipos.applock', '1');
            } else {
              localStorage.removeItem('medipos.applock');
            }
            lockBtn.classList.toggle('on', nextOn);
            lockBtn.setAttribute('aria-checked', String(nextOn));
          } finally {
            setTimeout(() => { lockBusy = false; }, 200);
          }
        });
      }

      el.querySelector('#acSupportRow')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showSupportSheet();
      });

      el.querySelector('#acLogoutBtn')?.addEventListener('click', () => {
        showLogoutSheet();
      });
    },
  });

  // 2. Màn Thông báo
  function notifTile(kind) {
    if (kind === 'web') return `<div class="tile">${App.icon('monitor', 20)}</div>`;
    if (kind === 'stock') return `<div class="tile warn">${App.icon('box', 20)}</div>`;
    if (kind === 'revenue') return `<div class="tile">${App.icon('chart', 20)}</div>`;
    if (kind === 'expiry') return `<div class="tile warn">${App.icon('clock', 20)}</div>`;
    if (kind === 'debt') return `<div class="tile">${App.icon('wallet', 20)}</div>`;
    return `<div class="tile">${App.icon('bell', 20)}</div>`;
  }

  function notifDayDiff(at) {
    const now = new Date();
    const d = new Date(at);
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((today0 - day0) / 86400000);
  }

  const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function formatNotifTime(at) {
    const d = new Date(at);
    const diff = notifDayDiff(at);
    if (diff === 0) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diff === 1) return 'Hôm qua';
    if (diff >= 2 && diff <= 6) return WEEKDAYS[d.getDay()];
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function renderNotifItem(item) {
    return `
      <div class="row ac-notif-row tap${item.unread ? ' unread' : ''}" data-id="${App.esc(item.id)}" data-kind="${App.esc(item.kind)}">
        ${notifTile(item.kind)}
        <div class="row-main">
          <div class="row-title">${App.esc(item.title)}</div>
          ${item.body ? `<div class="row-sub">${App.esc(item.body)}</div>` : ''}
        </div>
        <div class="row-end num ac-notif-time">${App.esc(formatNotifTime(item.at))}</div>
      </div>
    `;
  }

  function renderNotifEmpty(msg, withRetry) {
    return `
      <div class="empty">
        <div class="tile">${App.icon('bell', 28)}</div>
        <div>${App.esc(msg)}</div>
        ${withRetry ? '<button class="btn btn-secondary tap" id="acNotifRetry" style="margin-top:16px;height:40px;font-size:14px">Thử lại</button>' : ''}
      </div>
    `;
  }

  App.screen('notifications', {
    render: (p) => {
      const header = App.header({ title: 'Thông báo' });
      if (p && p.empty) {
        return `${header}${renderNotifEmpty('Chưa có thông báo nào.', false)}`;
      }
      return `
        ${header}
        <div id="acNotifBody" style="margin-top:16px;padding:0 16px">
          ${App.skeleton(5)}
        </div>
      `;
    },
    mount: (el, p) => {
      if (p && (p.empty || p.loading)) return;

      const body = el.querySelector('#acNotifBody');
      const navEnd = el.querySelector('.nav-side.end');

      function updateMarkAll(items) {
        if (!navEnd) return;
        const hasUnread = items.some((n) => n.unread);
        if (!hasUnread) {
          navEnd.innerHTML = '';
          return;
        }
        navEnd.innerHTML = '<button class="ac-head-btn tap" id="acMarkAll">Đọc hết</button>';
        navEnd.querySelector('#acMarkAll')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          const unreadIds = new Set(items.filter((n) => n.unread).map((n) => String(n.id)));
          if (!unreadIds.size) return;

          items.forEach((n) => { n.unread = false; });
          el.querySelectorAll('.ac-notif-row.unread').forEach((r) => r.classList.remove('unread'));
          navEnd.innerHTML = '';

          let r;
          try {
            r = await API.notifications.read();
          } catch (err) {
            r = { ok: false, error: (err && err.message) || 'Không đánh dấu được đã đọc' };
          }
          if (!el.isConnected) return;
          if (r && r.ok) {
            App.toast('Đã đọc hết', 'check');
          } else {
            App.toast((r && r.error) || 'Không đánh dấu được đã đọc', 'info');
            loadList();
          }
        });
      }

      let loadSeq = 0;
      async function loadList() {
        const seq = ++loadSeq;
        body.style.marginTop = '16px';
        body.style.padding = '0 16px';
        body.innerHTML = App.skeleton(5);
        if (navEnd) navEnd.innerHTML = '';

        let r;
        try {
          r = await API.notifications.list();
        } catch (err) {
          r = { ok: false, error: (err && err.message) || 'Không tải được thông báo.' };
        }
        if (!el.isConnected || seq !== loadSeq) return;

        if (!r || !r.ok) {
          body.style.marginTop = '';
          body.style.padding = '';
          body.innerHTML = renderNotifEmpty((r && r.error) || 'Không tải được thông báo.', true);
          body.querySelector('#acNotifRetry')?.addEventListener('click', loadList);
          return;
        }

        const items = r.items || [];
        if (!items.length) {
          body.style.marginTop = '';
          body.style.padding = '';
          body.innerHTML = renderNotifEmpty('Chưa có thông báo nào.', false);
          return;
        }

        const todayList = items.filter((n) => notifDayDiff(n.at) === 0);
        const earlierList = items.filter((n) => notifDayDiff(n.at) !== 0);

        body.style.marginTop = '0';
        body.style.padding = '0';
        body.innerHTML = `
          ${todayList.length ? `
            <div class="section" style="margin-top:16px">
              <div class="section-head"><h2 style="font-size:15px">Hôm nay</h2></div>
              <div class="card ac-notif-card">
                ${todayList.map(renderNotifItem).join('')}
              </div>
            </div>
          ` : ''}
          ${earlierList.length ? `
            <div class="section" style="margin-top:20px">
              <div class="section-head"><h2 style="font-size:15px">Trước đó</h2></div>
              <div class="card ac-notif-card">
                ${earlierList.map(renderNotifItem).join('')}
              </div>
            </div>
          ` : ''}
        `;

        updateMarkAll(items);

        body.querySelectorAll('.ac-notif-row.tap').forEach((row) => {
          row.addEventListener('click', () => {
            const id = row.dataset.id;
            const item = items.find((n) => String(n.id) === String(id));
            const wasUnread = !!(item && item.unread);
            if (item) item.unread = false;
            row.classList.remove('unread');
            if (!items.some((n) => n.unread) && navEnd) navEnd.innerHTML = '';

            API.notifications.read([id]).then((res) => {
              if (res && res.ok) return;
              if (wasUnread && item) item.unread = true;
              if (el.isConnected && seq === loadSeq && wasUnread) {
                row.classList.add('unread');
                updateMarkAll(items);
              }
            }).catch(() => {
              if (wasUnread && item) item.unread = true;
              if (el.isConnected && seq === loadSeq && wasUnread) {
                row.classList.add('unread');
                updateMarkAll(items);
              }
            });

            const kind = row.dataset.kind;
            if (kind !== 'web') App.openNotif(kind);
          });
        });
      }

      loadList();
    },
  });

  function showExpiryOptions(getDays, onPick) {
    const currentDays = getDays();
    const initIdx = EXPIRY_OPTIONS.includes(currentDays) ? EXPIRY_OPTIONS.indexOf(currentDays) : 1;
    App.sheet(`
      <h3>Báo cận hạn trước</h3>
      <div class="seg ac-expiry-options" role="group" aria-label="Số ngày báo trước">
        <span class="seg-thumb"></span>
        ${EXPIRY_OPTIONS.map((days) => `<button class="tap${EXPIRY_OPTIONS[initIdx] === days ? ' on' : ''}" type="button" aria-pressed="${EXPIRY_OPTIONS[initIdx] === days}">${days} ngày</button>`).join('')}
      </div>
    `, {
      onMount(sheetEl, close) {
        const thumb = sheetEl.querySelector('.seg-thumb');
        const buttons = [...sheetEl.querySelectorAll('.ac-expiry-options button')];
        const select = (button) => {
          buttons.forEach((btn) => {
            btn.classList.toggle('on', btn === button);
            btn.setAttribute('aria-pressed', String(btn === button));
          });
          thumb.style.left = button.offsetLeft + 'px';
          thumb.style.width = button.offsetWidth + 'px';
        };
        select(buttons[initIdx]);
        buttons.forEach((button, i) => {
          button.addEventListener('click', async () => {
            const nextDays = EXPIRY_OPTIONS[i];
            select(button);
            buttons.forEach((btn) => { btn.disabled = true; });
            const restore = App.busy(button, 'Đang lưu');
            const r = await onPick(nextDays);
            if (!sheetEl.isConnected) return;
            if (r && r.ok) {
              close();
            } else {
              restore();
              buttons.forEach((btn) => { btn.disabled = false; });
              select(buttons[initIdx]);
            }
          });
        });
      },
    });
  }

  const PUSH_STATES = {
    off: { title: 'Nhận thông báo trên máy này', sub: '', warn: false, action: 'enable' },
    on: { title: 'Đang nhận thông báo', sub: '', warn: false, action: 'disable' },
    denied: { title: 'Thông báo đang bị chặn', sub: 'Mở Cài đặt iPhone, chọn MediPOS, Thông báo để bật lại', warn: true, action: '' },
    install: { title: 'Thêm MediPOS vào Màn hình chính', sub: 'Bấm Chia sẻ, chọn Thêm vào Màn hình chính để nhận thông báo', warn: false, action: '' },
    unsupported: { title: 'Máy này không nhận được thông báo', sub: '', warn: false, action: '' },
  };

  function renderPushRow(status) {
    const cfg = PUSH_STATES[status] || PUSH_STATES.unsupported;
    const right = cfg.action === 'enable'
      ? '<button class="btn btn-primary ac-push-btn tap" type="button" id="acPushEnable">Bật</button>'
      : cfg.action === 'disable'
        ? '<button class="ac-push-off tap" type="button" id="acPushDisable">Tắt</button>'
        : '';
    return `
      <div class="row ac-push-row">
        <div class="tile${cfg.warn ? ' warn' : ''}">${App.icon('bell', 20)}</div>
        <div class="row-main">
          <div class="row-title">${App.esc(cfg.title)}</div>
          ${cfg.sub ? `<div class="row-sub">${App.esc(cfg.sub)}</div>` : ''}
        </div>
        ${right ? `<div class="row-end">${right}</div>` : ''}
      </div>
    `;
  }

  // 3. Màn Cài đặt thông báo
  App.screen('notifSettings', {
    render: () => {
      const header = App.header({ title: 'Cài đặt thông báo' });
      const isStaff = !!(API.me && API.me() && API.me().role === 'staff');
      return `
        ${header}
        <div class="section" style="margin-top:16px">
          <div class="section-head"><h2 style="font-size:15px">Thông báo trên máy này</h2></div>
          <div class="card" style="margin:0 16px" id="acPushCard">
            <div class="row ac-push-row">
              <div class="skel" style="width:36px;height:36px;border-radius:11px;flex:none"></div>
              <div class="row-main"><div class="skel" style="width:65%"></div></div>
            </div>
          </div>
        </div>

        <div style="margin-top:20px;padding:0 16px">
          <div class="card" style="overflow:hidden">
            <div class="row" style="cursor:default">
              <div class="tile">${App.icon('monitor', 20)}</div>
              <div class="row-main">
                <div class="row-title">Đăng nhập POS</div>
                <div class="row-sub">Luôn bật để biết khi tài khoản đăng nhập POS</div>
              </div>
              <div class="row-end">
                <button class="ac-switch on" disabled aria-disabled="true" aria-checked="true" aria-label="Đăng nhập POS"><span class="ac-knob"></span></button>
              </div>
            </div>

            <div class="row ac-toggle-row tap" data-key="lowStock">
              <div class="tile warn">${App.icon('box', 20)}</div>
              <div class="row-main">
                <div class="row-title">Thuốc sắp hết hàng</div>
              </div>
              <div class="row-end">
                <button class="ac-switch" disabled type="button" role="switch" aria-checked="false" aria-label="Thuốc sắp hết hàng"><span class="ac-knob"></span></button>
              </div>
            </div>

            <div class="row ac-toggle-row tap" data-key="expiring">
              <div class="tile warn">${App.icon('clock', 20)}</div>
              <div class="row-main">
                <div class="row-title">Hàng cận hạn</div>
              </div>
              <div class="row-end">
                <button class="ac-switch" disabled type="button" role="switch" aria-checked="false" aria-label="Hàng cận hạn"><span class="ac-knob"></span></button>
              </div>
            </div>

            ${isStaff ? '' : `
              <div class="row ac-toggle-row tap" data-key="revenue">
                <div class="tile">${App.icon('chart', 20)}</div>
                <div class="row-main">
                  <div class="row-title">Tổng kết doanh thu cuối ngày</div>
                  <div class="row-sub">Gửi lúc 21:00</div>
                </div>
                <div class="row-end">
                  <button class="ac-switch" disabled type="button" role="switch" aria-checked="false" aria-label="Tổng kết doanh thu cuối ngày"><span class="ac-knob"></span></button>
                </div>
              </div>

              <div class="row ac-toggle-row tap" data-key="debt">
                <div class="tile">${App.icon('wallet', 20)}</div>
                <div class="row-main">
                  <div class="row-title">Công nợ nhà cung cấp</div>
                  <div class="row-sub">Sáng thứ Hai, 8:00</div>
                </div>
                <div class="row-end">
                  <button class="ac-switch" disabled type="button" role="switch" aria-checked="false" aria-label="Công nợ nhà cung cấp"><span class="ac-knob"></span></button>
                </div>
              </div>
            `}
          </div>
        </div>
        <div class="section ac-bottom">
          <div class="section-head"><h2>Ngưỡng cảnh báo</h2></div>
          <div class="card" style="margin:0 16px">
            <button class="row ac-detail-row tap" type="button" id="acStockThreshold">
              <span class="row-main row-title">Báo hết hàng khi còn dưới</span>
              <span class="row-end">mức tối thiểu${App.icon('chev', 18)}</span>
            </button>
            <button class="row ac-detail-row tap" type="button" id="acExpiryThreshold" disabled>
              <span class="row-main row-title">Báo cận hạn trước</span>
              <span class="row-end"><span class="num" id="acExpiryDays">30 ngày</span>${App.icon('chev', 18)}</span>
            </button>
          </div>
        </div>
      `;
    },
    mount: (el, p) => {
      if (el._mounted) return;
      el._mounted = true;

      let expiryDays = 30;
      let prefsLoaded = false;
      let savingExpiry = false;
      const pushCard = el.querySelector('#acPushCard');
      const expiryBtn = el.querySelector('#acExpiryThreshold');
      const daysEl = el.querySelector('#acExpiryDays');

      async function saveExpiryDays(nextDays) {
        savingExpiry = true;
        if (expiryBtn) expiryBtn.disabled = true;
        let r;
        try {
          r = await API.push.prefs({ expiryDays: nextDays });
        } catch (err) {
          r = { ok: false, error: (err && err.message) || 'Không lưu được cài đặt' };
        }
        savingExpiry = false;
        if (!el.isConnected) return r;
        if (expiryBtn && prefsLoaded) expiryBtn.disabled = false;
        if (r && r.ok) {
          expiryDays = nextDays;
          if (daysEl) daysEl.textContent = `${nextDays} ngày`;
          App.toast('Đã lưu', 'check');
        } else {
          App.toast((r && r.error) || 'Không lưu được cài đặt', 'info');
        }
        return r;
      }

      function openExpirySheet() {
        if (!prefsLoaded || savingExpiry) return;
        showExpiryOptions(() => expiryDays, saveExpiryDays);
      }

      function applyPushState(status) {
        if (!pushCard || !el.isConnected) return;
        pushCard.innerHTML = renderPushRow(status);

        const enableBtn = pushCard.querySelector('#acPushEnable');
        if (enableBtn) {
          enableBtn.addEventListener('click', () => {
            if (enableBtn.disabled) return;
            const req = API.push.enable();
            const restore = App.busy(enableBtn, 'Đang bật');
            req.then((r) => {
              if (!el.isConnected) return;
              if (r && r.ok) {
                applyPushState('on');
                App.toast('Đã bật thông báo', 'check');
              } else if (r && r.denied) {
                applyPushState('denied');
              } else {
                restore();
                App.toast((r && r.error) || 'Không bật được thông báo', 'info');
              }
            }).catch((err) => {
              if (!el.isConnected) return;
              restore();
              App.toast((err && err.message) || 'Không bật được thông báo', 'info');
            });
          });
        }

        const disableBtn = pushCard.querySelector('#acPushDisable');
        if (disableBtn) {
          disableBtn.addEventListener('click', async () => {
            if (disableBtn.disabled) return;
            const restore = App.busy(disableBtn, 'Đang tắt');
            let r;
            try {
              r = await API.push.disable();
            } catch (err) {
              r = { ok: false, error: (err && err.message) || 'Không tắt được thông báo' };
            }
            if (!el.isConnected) return;
            if (r && r.ok) {
              applyPushState('off');
            } else {
              restore();
              App.toast((r && r.error) || 'Không tắt được thông báo', 'info');
            }
          });
        }
      }

      if (p && p.pushState) {
        applyPushState(p.pushState);
      } else {
        API.push.status().then((status) => {
          applyPushState(status);
        }).catch(() => {
          applyPushState('unsupported');
        });
      }

      const toggleRows = [...el.querySelectorAll('.ac-toggle-row')];
      function setSwitch(sw, val) {
        sw.classList.toggle('on', !!val);
        sw.setAttribute('aria-checked', String(!!val));
      }

      API.push.prefs().then((r) => {
        if (!el.isConnected) return;
        if (!r || !r.ok || !r.prefs) {
          App.toast((r && r.error) || 'Không tải được cài đặt', 'info');
          return;
        }
        const prefs = r.prefs;
        if (prefs.expiryDays) {
          expiryDays = prefs.expiryDays;
          if (daysEl) daysEl.textContent = `${expiryDays} ngày`;
        }
        prefsLoaded = true;
        if (expiryBtn && !savingExpiry) expiryBtn.disabled = false;
        toggleRows.forEach((row) => {
          const key = row.dataset.key;
          const sw = row.querySelector('.ac-switch');
          if (!sw || !key) return;
          setSwitch(sw, prefs[key]);
          sw.disabled = false;
        });
        if (p && p.openExpiry && App.current()?.el === el) openExpirySheet();
      }).catch((err) => {
        if (!el.isConnected) return;
        App.toast((err && err.message) || 'Không tải được cài đặt', 'info');
      });

      toggleRows.forEach((row) => {
        row.addEventListener('click', async () => {
          const key = row.dataset.key;
          const sw = row.querySelector('.ac-switch');
          if (!key || !sw || sw.disabled || row.dataset.busy === '1') return;

          const oldVal = sw.classList.contains('on');
          const newVal = !oldVal;
          setSwitch(sw, newVal);
          sw.disabled = true;
          row.dataset.busy = '1';

          let r;
          try {
            r = await API.push.prefs({ [key]: newVal });
          } catch (err) {
            r = { ok: false, error: (err && err.message) || 'Không lưu được cài đặt' };
          }
          if (!el.isConnected) return;
          if (r && r.ok) {
            App.toast('Đã lưu', 'check');
          } else {
            setSwitch(sw, oldVal);
            App.toast((r && r.error) || 'Không lưu được cài đặt', 'info');
          }
          sw.disabled = false;
          delete row.dataset.busy;
        });
      });

      el.querySelector('#acStockThreshold')?.addEventListener('click', () => App.toast('Chỉnh trên web, mục Kho', 'info'));
      expiryBtn?.addEventListener('click', openExpirySheet);
    },
  });

  // 4. Màn Thông tin nhà thuốc
  App.screen('storeInfo', {
    render: () => {
      const header = App.header({ title: 'Thông tin nhà thuốc' });
      const store = DATA.store || { name: 'Nhà thuốc Tâm An', branch: 'Chi nhánh Lê Văn Sỹ', address: '214 Lê Văn Sỹ, Phường 1, Quận 3, TP.HCM' };
      const owner = DATA.owner || { name: 'Trần Minh Khoa', phone: '0903 128 466' };

      return `
        ${header}
        <div style="margin-top:16px;padding:0 16px">
          <div class="card ac-info-card">
            <div class="ac-info-item">
              <div class="ac-info-label">Tên nhà thuốc</div>
              <div class="ac-info-val">${App.esc(store.name)}</div>
            </div>
            <div class="ac-info-item">
              <div class="ac-info-label">Chi nhánh</div>
              <div class="ac-info-val">${App.esc(store.branch)}</div>
            </div>
            <div class="ac-info-item">
              <div class="ac-info-label">Địa chỉ</div>
              <div class="ac-info-val ac-info-wrap">${App.esc(store.address)}</div>
            </div>
            <div class="ac-info-item">
              <div class="ac-info-label">Chủ nhà thuốc</div>
              <div class="ac-info-val">${App.esc(owner.name)}</div>
            </div>
            <div class="ac-info-item">
              <div class="ac-info-label">Số điện thoại</div>
              <div class="ac-info-val num">${App.esc(owner.phone)}</div>
            </div>
          </div>
          <p class="ac-store-note">Sửa thông tin trên web, mục Cài đặt.</p>
        </div>
        <div class="section ac-store-section">
          <div class="section-head"><h2>Giờ mở cửa</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row ac-detail-row">
              <div class="row-main row-title">Thứ Hai đến Thứ Bảy</div>
              <div class="row-end num">7:00 đến 22:00</div>
            </div>
            <div class="row ac-detail-row">
              <div class="row-main row-title">Chủ nhật</div>
              <div class="row-end num">7:30 đến 21:00</div>
            </div>
          </div>
        </div>
        <div class="section ac-store-section ac-bottom">
          <div class="section-head"><h2>Gói MediPOS</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row ac-detail-row">
              <div class="row-main">
                <div class="row-title">Gói Nhà thuốc</div>
                <div class="row-sub">3 nhân viên, 1 chi nhánh. Gia hạn ngày 15/01/2027</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  });

  // State QA (nhóm 'Tài khoản')
  App.state('Tài khoản', () => {
    localStorage.removeItem('medipos.mockRole');
    App.reset('account');
  }, 'Tài khoản');
  App.state('Tài khoản: đã bật khoá app', () => {
    localStorage.setItem('medipos.bio', '1');
    localStorage.setItem('medipos.applock', '1');
    App.reset('account');
  }, 'Tài khoản');
  App.state('Tài khoản: xác nhận đăng xuất', () => {
    App.reset('account');
    setTimeout(showLogoutSheet, 320);
  }, 'Tài khoản');
  App.state('Thông báo', () => App.go('notifications'), 'Tài khoản');
  App.state('Thông báo: rỗng', () => App.go('notifications', { empty: true }), 'Tài khoản');
  App.state('Thông báo: đang tải', () => App.go('notifications', { loading: true }), 'Tài khoản');
  App.state('Cài đặt thông báo', () => App.go('notifSettings'), 'Tài khoản');
  App.state('Cài đặt thông báo: chưa bật', () => App.go('notifSettings', { pushState: 'off' }), 'Tài khoản');
  App.state('Cài đặt thông báo: đã bật', () => App.go('notifSettings', { pushState: 'on' }), 'Tài khoản');
  App.state('Cài đặt thông báo: bị chặn', () => App.go('notifSettings', { pushState: 'denied' }), 'Tài khoản');
  App.state('Cài đặt thông báo: thêm vào Màn hình chính', () => App.go('notifSettings', { pushState: 'install' }), 'Tài khoản');
  App.state('Cài đặt thông báo: không hỗ trợ', () => App.go('notifSettings', { pushState: 'unsupported' }), 'Tài khoản');
  App.state('Cài đặt thông báo: chọn ngưỡng cận hạn', () => {
    App.reset('account');
    App.go('notifSettings', { openExpiry: true });
  }, 'Tài khoản');
  App.state('Mở từ thông báo: doanh thu', () => {
    App.reset('home');
    App.openNotif('revenue');
  }, 'Tài khoản');
  App.state('Thông tin nhà thuốc', () => App.go('storeInfo'), 'Tài khoản');
})();
