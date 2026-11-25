/* screens/account.js — Tab Tài khoản, thông báo, cài đặt, thông tin nhà thuốc */
App.css(`
.ac-profile { display: flex; flex-direction: column; align-items: center; text-align: center; padding: calc(var(--sat) + 16px) 20px 20px; }
.ac-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--teal-100); color: var(--teal-800); display: grid; place-items: center; font-size: 26px; font-weight: 700; margin-bottom: 12px; }
.ac-name { font-size: 22px; font-weight: 700; color: var(--ink); line-height: 1.25; }
.ac-role { font-size: 14px; color: var(--ink-2); margin-top: 4px; }

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

.ac-head-btn { font-size: 14px; font-weight: 600; color: var(--teal-700); padding: 4px 0; background: none; border: none; cursor: pointer; }

.ac-info-card { margin: 16px 16px 0; padding: 4px 16px; }
.ac-info-item { padding: 14px 0; }
.ac-info-item + .ac-info-item { border-top: 1px solid var(--line); }
.ac-info-label { font-size: 13px; color: var(--ink-3); line-height: 1.4; margin-bottom: 4px; }
.ac-info-val { font-size: 15px; font-weight: 600; color: var(--ink); line-height: 1.4; }
.ac-info-wrap { white-space: normal; word-break: break-word; }
.ac-store-note { font-size: 13px; color: var(--ink-3); text-align: center; margin-top: 20px; padding: 0 20px; line-height: 1.4; }
`);

(function () {
  let faceIdEnabled = true;

  const notifPrefs = {
    lowStock: true,
    expiring: true,
    dailySummary: true,
  };

  function showSupportSheet() {
    App.sheet(`
      <h3>Hỗ trợ kỹ thuật</h3>
      <p>Tổng đài dược sĩ và kỹ thuật PharmaPOS luôn sẵn sàng hỗ trợ nhà thuốc.</p>
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
          App.toast('Đang mở Zalo PharmaPOS', 'check');
        });
      },
    });
  }

  function showLogoutSheet() {
    let logoutTimer = null;
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
        sheetEl.querySelector('#acLogoutConfirm')?.addEventListener('click', (e) => {
          App.busy(e.currentTarget, 'Đang đăng xuất...');
          if (cancelBtn) cancelBtn.style.pointerEvents = 'none';
          logoutTimer = setTimeout(() => {
            close();
            App.reset('login');
          }, 800);
        });
      },
      onClose() {
        if (logoutTimer) {
          clearTimeout(logoutTimer);
          logoutTimer = null;
        }
      },
    });
  }

  // 1. Màn Tài khoản
  App.screen('account', {
    tab: 'account',
    render: () => {
      const owner = DATA.owner || { name: 'Trần Minh Khoa', role: 'Chủ nhà thuốc', initials: 'MK' };
      const store = DATA.store || { name: 'Nhà thuốc Tâm An' };
      const ws = DATA.webSessions || [];

      return `
        <div class="ac-profile">
          <div class="ac-avatar">${App.esc(owner.initials || 'MK')}</div>
          <div class="ac-name">${App.esc(owner.name)}</div>
          <div class="ac-role">${App.esc(owner.role)}, ${App.esc(store.name)}</div>
        </div>

        <div class="section" style="margin-top:8px">
          <div class="section-head"><h2 style="font-size:15px">Bảo mật</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" id="acFaceIdRow">
              <div class="tile">${App.icon('faceid', 20)}</div>
              <div class="row-main"><div class="row-title">Face ID</div></div>
              <div class="row-end">
                <button class="ac-switch${faceIdEnabled ? ' on' : ''}" id="acFaceIdBtn" type="button" role="switch" aria-checked="${faceIdEnabled}" aria-label="Face ID"><span class="ac-knob"></span></button>
              </div>
            </div>
            <div class="row tap" data-go="pinSetup" data-p='{"mode":"change"}'>
              <div class="tile">${App.icon('lock', 20)}</div>
              <div class="row-main"><div class="row-title">Đổi mã PIN</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div>
            </div>
            <div class="row tap" data-go="webSessions">
              <div class="tile">${App.icon('monitor', 20)}</div>
              <div class="row-main"><div class="row-title">Phiên web đang mở</div></div>
              <div class="row-end num">${ws.length}${App.icon('chev', 20)}</div>
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

      const fidBtn = el.querySelector('#acFaceIdBtn');
      const fidRow = el.querySelector('#acFaceIdRow');
      if (fidRow && fidBtn) {
        fidRow.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (faceIdEnabled) {
            faceIdEnabled = false;
            fidBtn.classList.remove('on');
            fidBtn.setAttribute('aria-checked', 'false');
          } else {
            const ok = await App.faceId();
            if (ok) {
              faceIdEnabled = true;
              fidBtn.classList.add('on');
              fidBtn.setAttribute('aria-checked', 'true');
            }
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
    return `<div class="tile">${App.icon('bell', 20)}</div>`;
  }

  function renderNotifItem(item) {
    return `
      <div class="row ac-notif-row tap${item.unread ? ' unread' : ''}" data-id="${App.esc(item.id)}" data-kind="${App.esc(item.kind)}">
        ${notifTile(item.kind)}
        <div class="row-main">
          <div class="row-title">${App.esc(item.title)}</div>
          <div class="row-sub">${App.esc(item.body)}</div>
        </div>
        <div class="row-end num ac-notif-time">${App.esc(item.time)}</div>
      </div>
    `;
  }

  App.screen('notifications', {
    render: (p) => {
      const items = (p && p.empty) ? [] : (DATA.notifications || []);
      const hasUnread = items.some((n) => n.unread);
      const right = items.length && hasUnread
        ? `<button class="ac-head-btn tap" id="acMarkAll">Đọc hết</button>`
        : '';

      const header = App.header({ title: 'Thông báo', right });
      if (!items.length) {
        return `
          ${header}
          <div class="empty">
            <div class="tile">${App.icon('bell', 28)}</div>
            Chưa có thông báo nào.
          </div>
        `;
      }

      const todayList = items.filter((n) => n.time !== 'Hôm qua');
      const earlierList = items.filter((n) => n.time === 'Hôm qua');

      return `
        ${header}
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
    },
    mount: (el) => {
      if (el._mounted) return;
      el._mounted = true;

      el.querySelectorAll('.ac-notif-row').forEach((row) => {
        row.addEventListener('click', () => {
          const id = row.dataset.id;
          const item = (DATA.notifications || []).find((n) => n.id === id);
          if (item) item.unread = false;
          row.classList.remove('unread');

          const kind = row.dataset.kind;
          if (kind === 'web') App.go('webConfirm', { from: 'push' }, 'up');
          else if (kind === 'stock') App.go('lowStock');
          else if (kind === 'revenue') App.tab('revenue');
          else if (kind === 'expiry') App.go('expiring');
        });
      });

      el.querySelector('#acMarkAll')?.addEventListener('click', (e) => {
        e.stopPropagation();
        (DATA.notifications || []).forEach((n) => { n.unread = false; });
        el.querySelectorAll('.ac-notif-row.unread').forEach((r) => r.classList.remove('unread'));
        e.currentTarget.remove();
        App.toast('Đã đọc hết', 'check');
      });
    },
  });

  // 3. Màn Cài đặt thông báo
  App.screen('notifSettings', {
    render: () => {
      const header = App.header({ title: 'Cài đặt thông báo' });
      return `
        ${header}
        <div style="margin-top:16px;padding:0 16px">
          <div class="card" style="overflow:hidden">
            <div class="row" style="cursor:default">
              <div class="tile">${App.icon('monitor', 20)}</div>
              <div class="row-main">
                <div class="row-title">Yêu cầu đăng nhập web</div>
                <div class="row-sub">Luôn bật để không bỏ lỡ ai đang đăng nhập web.</div>
              </div>
              <div class="row-end">
                <button class="ac-switch on" disabled aria-disabled="true" aria-checked="true" aria-label="Yêu cầu đăng nhập web"><span class="ac-knob"></span></button>
              </div>
            </div>

            <div class="row ac-toggle-row tap" data-key="lowStock">
              <div class="tile warn">${App.icon('box', 20)}</div>
              <div class="row-main">
                <div class="row-title">Thuốc sắp hết hàng</div>
              </div>
              <div class="row-end">
                <button class="ac-switch${notifPrefs.lowStock ? ' on' : ''}" type="button" role="switch" aria-checked="${notifPrefs.lowStock}" aria-label="Thuốc sắp hết hàng"><span class="ac-knob"></span></button>
              </div>
            </div>

            <div class="row ac-toggle-row tap" data-key="expiring">
              <div class="tile warn">${App.icon('clock', 20)}</div>
              <div class="row-main">
                <div class="row-title">Hàng cận hạn</div>
              </div>
              <div class="row-end">
                <button class="ac-switch${notifPrefs.expiring ? ' on' : ''}" type="button" role="switch" aria-checked="${notifPrefs.expiring}" aria-label="Hàng cận hạn"><span class="ac-knob"></span></button>
              </div>
            </div>

            <div class="row ac-toggle-row tap" data-key="dailySummary">
              <div class="tile">${App.icon('chart', 20)}</div>
              <div class="row-main">
                <div class="row-title">Tổng kết doanh thu cuối ngày</div>
                <div class="row-sub">Gửi lúc 21:00</div>
              </div>
              <div class="row-end">
                <button class="ac-switch${notifPrefs.dailySummary ? ' on' : ''}" type="button" role="switch" aria-checked="${notifPrefs.dailySummary}" aria-label="Tổng kết doanh thu cuối ngày"><span class="ac-knob"></span></button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    mount: (el) => {
      if (el._mounted) return;
      el._mounted = true;

      el.querySelectorAll('.ac-toggle-row').forEach((row) => {
        row.addEventListener('click', () => {
          const key = row.dataset.key;
          if (!key || typeof notifPrefs[key] === 'undefined') return;
          notifPrefs[key] = !notifPrefs[key];
          const sw = row.querySelector('.ac-switch');
          if (sw) {
            sw.classList.toggle('on', notifPrefs[key]);
            sw.setAttribute('aria-checked', String(notifPrefs[key]));
          }
          App.toast('Đã lưu', 'check');
        });
      });
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
      `;
    },
  });

  // State QA (nhóm 'Tài khoản')
  App.state('Tài khoản', () => App.reset('account'), 'Tài khoản');
  App.state('Tài khoản: xác nhận đăng xuất', () => {
    App.reset('account');
    setTimeout(showLogoutSheet, 320);
  }, 'Tài khoản');
  App.state('Thông báo', () => App.go('notifications'), 'Tài khoản');
  App.state('Thông báo: rỗng', () => App.go('notifications', { empty: true }), 'Tài khoản');
  App.state('Cài đặt thông báo', () => App.go('notifSettings'), 'Tài khoản');
  App.state('Thông tin nhà thuốc', () => App.go('storeInfo'), 'Tài khoản');
})();
