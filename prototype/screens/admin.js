/* Quản lý tài khoản trong app, chỉ dành cho admin. */
(function () {
  App.css(`
.adm-view .nav { grid-template-columns: 44px minmax(0, 1fr) 44px; }
.adm-list-view:not([hidden]) { display: flex; flex-direction: column; overflow: hidden; }
.adm-list { flex: 1; min-height: 0; overflow: auto; scrollbar-width: none; }
.adm-content, .adm-list { padding: 8px 16px 16px; }
.adm-content { padding-bottom: var(--sab); }
.adm-footer { flex: none; padding: 8px 16px var(--sab); }
.adm-group { margin-bottom: 16px; }
.adm-group h2 { margin: 0 4px 8px; font-size: 14px; color: var(--ink-2); }
.adm-group .row { width: 100%; grid-template-columns: minmax(0, 1fr) auto; text-align: left; }
.adm-group .row + .row::before { left: 16px; }
.adm-status { font-size: 13px; color: var(--ink-2); }
.adm-form { display: grid; gap: 16px; }
.adm-form .card { display: grid; gap: 14px; padding: 16px; }
.adm-field { display: grid; gap: 6px; font-size: 14px; font-weight: 600; }
.adm-field input { width: 100%; min-width: 0; height: 46px; padding: 0 12px; border: 1px solid var(--line);
  border-radius: var(--radius-sm); background: var(--card); color: var(--ink); font: inherit; font-size: 16px; }
.adm-roles { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; background: var(--soft); border-radius: 14px; }
.adm-roles button, .adm-roles label { position: relative; display: grid; place-items: center; min-height: 40px;
  border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--ink-2); text-align: center; }
.adm-roles [aria-pressed="true"], .adm-roles label:has(:checked) { background: var(--card); color: var(--ink); }
.adm-roles label:has(:focus-visible) { outline: 2px solid var(--teal-700); }
.adm-roles input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.adm-roles button:disabled { color: var(--ink-3); cursor: default; }
.adm-roles .spin { width: 14px; height: 14px; }
.adm-note { font-size: 13px; color: var(--ink-2); line-height: 1.5; }
.adm-info { margin: 0; padding: 0 16px; }
.adm-info > div { display: grid; grid-template-columns: 100px minmax(0, 1fr); align-items: baseline; gap: 8px; padding: 14px 0; }
.adm-info > div + div { border-top: 1px solid var(--line); }
.adm-info dt { font-size: 14px; color: var(--ink-2); }
.adm-info dd { margin: 0; min-width: 0; font-size: 15px; overflow-wrap: anywhere; }
.adm-email { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.adm-email .link:disabled { color: var(--ink-3); }
.adm-actions { display: grid; gap: 12px; margin-top: 20px; }
.adm-actions h2 { font-size: 15px; font-weight: 600; }
.adm-sheet { margin-top: 16px; }
.adm-lock-title { overflow-wrap: anywhere; }
`);

  const roles = { admin: 'Admin', manager: 'Quản lý', staff: 'Nhân viên' };
  const statuses = { active: 'Đang dùng', invited: 'Chờ kích hoạt', locked: 'Đã khoá' };
  const editableRoles = ['manager', 'staff'];
  const admin = () => API.me()?.role === 'admin';
  const active = (el) => App.current()?.el === el;
  const emailField = '<label class="adm-field">Email<input name="email" type="email" autocapitalize="off" autocomplete="email" required></label>';
  const denied = '<div class="empty">Chỉ admin được quản lý tài khoản.</div>';
  const retry = '<button class="btn btn-secondary block" data-adm-retry>Thử lại</button>';
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  const mockChanges = new Map();
  let syncList = () => {};

  async function loadUsers() {
    const r = await API.admin.list();
    if (r.ok && !API.live) {
      const users = new Map(r.users.map((u) => [u.id, u]));
      mockChanges.forEach((u, id) => users.set(id, u));
      return { ok: true, users: [...users.values()] };
    }
    return r;
  }

  function saveUser(user) {
    if (!API.live) mockChanges.set(user.id, user);
    syncList(user);
  }

  function formatPhone(phone) {
    return phone ? phone.replace(/^84(\d{3})(\d{3})(\d{3})$/, '0$1 $2 $3') : 'Chưa có số điện thoại';
  }

  function accountGroups(users) {
    if (!users.length) return '<div class="empty">Chưa có tài khoản.</div>';
    return Object.entries(roles).map(([role, label]) => {
      const group = users.filter((u) => u.role === role).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      if (!group.length) return '';
      return `<section class="adm-group">
        <h2>${label}</h2>
        <div class="card">${group.map((u) => `
          <button class="row tap" data-go="accountDetail" data-p="${App.esc(JSON.stringify({ id: u.id }))}">
            <span class="row-main">
              <span class="row-title ell" style="display:block">${App.esc(u.name)}</span>
              <span class="row-sub ell" style="display:block">${App.esc(u.email || 'Chưa có email')}</span>
            </span>
            ${u.status === 'active' ? '' : `<span class="adm-status">${statuses[u.status]}</span>`}
          </button>`).join('')}</div>
      </section>`;
    }).join('');
  }

  App.screen('accounts', {
    cls: 'adm-view adm-list-view',
    render: () => App.header({ title: 'Tài khoản' }) + (admin() ? `
      <div class="adm-list">${App.skeleton()}</div>
      <div class="adm-footer"><button class="btn btn-primary block tap" data-go="accountNew" disabled>Cấp tài khoản</button></div>
    ` : denied),
    mount(el) {
      if (!admin()) return;
      const list = el.querySelector('.adm-list');
      const create = el.querySelector('[data-go="accountNew"]');
      let users = [];
      const load = async () => {
        create.disabled = true;
        list.innerHTML = App.skeleton();
        const r = await loadUsers();
        if (!el.isConnected || !admin()) return;
        if (!r.ok) {
          list.innerHTML = retry;
          if (active(el)) App.toast(r.error, 'x');
          return;
        }
        users = r.users;
        list.innerHTML = accountGroups(users);
        create.disabled = false;
      };
      syncList = (user) => {
        if (!el.isConnected || !admin()) return;
        if (!user) { load(); return; }
        users = [...users.filter((u) => u.id !== user.id), user];
        list.innerHTML = accountGroups(users);
      };
      list.onclick = (e) => { if (e.target.closest('[data-adm-retry]')) load(); };
      load();
    },
  });

  App.screen('accountNew', {
    cls: 'adm-view',
    render: () => App.header({ title: 'Cấp tài khoản' }) + (admin() ? `
      <form class="adm-form adm-content">
        <div class="card">
          <label class="adm-field">Họ tên<input name="name" autocomplete="name" required minlength="2"></label>
          ${emailField}
          <label class="adm-field">Số điện thoại (không bắt buộc)<input name="phone" type="tel" inputmode="tel" autocomplete="tel"></label>
          <div class="adm-field">
            <span>Vai trò</span>
            <div class="adm-roles" role="group" aria-label="Vai trò">
              ${editableRoles.map((role) => `<label><input type="radio" name="role" value="${role}"${role === 'staff' ? ' checked' : ''}>${roles[role]}</label>`).join('')}
            </div>
          </div>
        </div>
        <p class="adm-note">Người được cấp mở app MediPOS, nhập email này để nhận mã và tạo mật khẩu.</p>
        <button class="btn btn-primary block tap">Cấp tài khoản</button>
      </form>` : denied),
    mount(el) {
      if (!admin()) return;
      const form = el.querySelector('form');
      const button = form.querySelector('button');
      form.onsubmit = async (e) => {
        e.preventDefault();
        if (button.disabled || !admin() || !active(el)) return;
        const { name, email, role, phone } = Object.fromEntries(new FormData(form));
        const digits = phone.replace(/[\s().-]/g, '').replace(/^\+84/, '84').replace(/^0/, '84');
        if (phone.trim() && !/^84\d{9}$/.test(digits)) {
          App.toast('Số điện thoại cần đủ 10 số', 'x');
          return;
        }
        const restore = App.busy(button, 'Đang cấp...');
        const r = await API.admin.create({ name: name.trim(), email: email.trim(), role, phone: digits || null });
        if (r.ok) saveUser({ createdAt: new Date().toISOString(), ...r.user });
        if (!active(el)) return;
        restore();
        if (!r.ok) { App.toast(r.error, 'x'); return; }
        App.toast('Đã cấp tài khoản');
        App.back();
      };
    },
  });

  function detailBody(u, readOnly) {
    const date = u.createdAt && new Date(u.createdAt);
    const locked = u.status === 'locked';
    const disabled = u.email ? '' : ' disabled';
    return `
      <dl class="card adm-info">
        <div><dt>Email</dt><dd class="adm-email">${App.esc(u.email || 'Chưa có email')}${!u.email && !readOnly ? ' <button class="link" data-adm-link>Gắn email</button>' : ''}</dd></div>
        <div><dt>Số điện thoại</dt><dd>${App.esc(formatPhone(u.phone))}</dd></div>
        <div><dt>Trạng thái</dt><dd>${statuses[u.status]}</dd></div>
        <div><dt>Ngày cấp</dt><dd>${date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : 'Chưa có thông tin'}</dd></div>
        ${readOnly ? `<div><dt>Vai trò</dt><dd>${roles[u.role]}</dd></div>` : ''}
      </dl>
      ${readOnly ? '' : `
        <div class="adm-actions">
          ${u.email ? '<button class="btn btn-secondary block tap" data-adm-edit>Sửa thông tin</button>' : ''}
          <h2>Vai trò</h2>
          <div class="adm-roles" role="group" aria-label="Vai trò">
            ${editableRoles.map((role) => `<button data-adm-role="${role}" aria-pressed="${role === u.role}"${disabled}>${roles[role]}</button>`).join('')}
          </div>
          ${u.email ? '' : '<p class="adm-note">Gắn email trước để quản lý tài khoản này</p>'}
          <button class="btn btn-${locked ? 'secondary' : 'danger'} block tap" data-adm-lock${disabled}>${locked ? 'Mở khoá' : 'Khoá tài khoản'}</button>
        </div>`}`;
  }

  App.screen('accountDetail', {
    cls: 'adm-view',
    render: () => App.header({ title: 'Tài khoản' }) + `<div class="adm-content">${admin() ? App.skeleton() : denied}</div>`,
    mount(el, { id, edit }) {
      if (!admin()) return;
      const content = el.querySelector('.adm-content');
      let user;
      let pending = false;
      let dialogOpen = false;
      const readOnly = () => user.role === 'admin' || user.id === API.me()?.id;
      const draw = () => {
        el.querySelector('.nav-title').textContent = user.name;
        content.innerHTML = detailBody(user, readOnly());
      };
      const load = async (changed = false) => {
        const r = await loadUsers();
        const found = r.ok && r.users.find((u) => u.id === id);
        if (changed) syncList(found || undefined);
        if (!active(el) || !admin()) return;
        if (!found) {
          content.innerHTML = r.ok ? '<div class="empty">Không tìm thấy tài khoản.</div>' : retry;
          App.toast(r.ok ? 'Không tìm thấy tài khoản' : r.error, 'x');
          return;
        }
        user = found;
        draw();
      };

      const submit = async (button, label, request, patch, close) => {
        if (pending || !admin() || !active(el) || readOnly()) return;
        pending = true;
        const restore = App.busy(button, label);
        content.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
        const wrap = close && button.closest('.sheet-wrap');
        const scrim = wrap && wrap.querySelector('.scrim');
        scrim?.removeAttribute('data-close');
        const r = await request();
        if (r.ok && patch) saveUser({ ...user, ...patch, ...r.user });
        if (r.ok && !patch) {
          await load(true);
        } else if (active(el)) {
          if (r.ok) user = { ...user, ...patch, ...r.user };
          draw();
          if (!r.ok) App.toast(r.error, 'x');
        }
        restore();
        pending = false;
        if (r.ok || !active(el)) close?.();
        else scrim?.setAttribute('data-close', '');
      };

      function openSheet(html, onMount) {
        dialogOpen = true;
        App.sheet(html, { onMount, onClose: () => { dialogOpen = false; } });
      }

      function openEdit() {
        if (!user || readOnly() || !user.email || dialogOpen || pending) return;
        openSheet(`<h3>Sửa thông tin</h3>
          <form class="adm-form adm-sheet">
            <label class="adm-field">Họ tên<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label>
            ${emailField}
            <p class="adm-note">Đổi email thì lần đăng nhập sau dùng email mới.</p>
            <button class="btn btn-primary block tap">Lưu</button>
          </form>`, (sheet, close) => {
          const form = sheet.querySelector('form');
          form.elements.name.value = user.name;
          form.elements.email.value = user.email;
          form.onsubmit = (event) => {
            event.preventDefault();
            const name = form.elements.name.value.trim();
            const email = form.elements.email.value.trim().toLowerCase();
            const changes = {};
            if (name !== user.name) changes.name = name;
            if (email !== (user.email || '').toLowerCase()) changes.email = email;
            if (!Object.keys(changes).length) { close(); return; }
            submit(form.querySelector('button'), 'Đang lưu...', () => API.admin.update(id, changes), changes, close);
          };
        });
      }

      content.onclick = (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled || pending || dialogOpen || !admin()) return;
        if (btn.hasAttribute('data-adm-retry')) { content.innerHTML = App.skeleton(); load(); return; }
        if (!user || readOnly()) return;
        if (btn.hasAttribute('data-adm-link') && !user.email) {
          openSheet(`<h3>Gắn email</h3>
            <form class="adm-form adm-sheet">${emailField}<button class="btn btn-primary block tap">Gắn email</button></form>`, (sheet, close) => {
            const form = sheet.querySelector('form');
            form.onsubmit = (event) => {
              event.preventDefault();
              const email = form.elements.email.value.trim();
              submit(form.querySelector('button'), 'Đang gắn...', () => API.admin.linkEmail(id, email), {}, close);
            };
          });
        } else if (!user.email) {
          return;
        } else if (btn.hasAttribute('data-adm-edit')) {
          openEdit();
        } else if (btn.dataset.admRole && btn.dataset.admRole !== user.role) {
          const role = btn.dataset.admRole;
          if (editableRoles.includes(role)) submit(btn, 'Đang đổi...', () => API.admin.setRole(id, role), { role });
        } else if (btn.hasAttribute('data-adm-lock')) {
          if (user.status === 'locked') {
            const patch = API.live ? null : { status: user.statusBeforeLock || 'active' };
            submit(btn, 'Đang mở khoá...', () => API.admin.unlock(id), patch);
          } else {
            openSheet(`<h3 class="adm-lock-title">Khoá tài khoản ${App.esc(user.name)}?</h3>
              <p>Người này bị đăng xuất khỏi mọi máy và không đăng nhập được nữa.</p>
              <button class="btn btn-danger block tap adm-sheet">Khoá</button>`, (sheet, close) => {
              const lock = sheet.querySelector('button');
              lock.onclick = () => submit(lock, 'Đang khoá...', () => API.admin.lock(id),
                API.live ? { status: 'locked' } : { status: 'locked', statusBeforeLock: user.status }, close);
            });
          }
        }
      };
      load().then(() => {
        if (edit && active(el) && admin() && user && !readOnly() && user.email) openEdit();
      });
    },
  });

  function preview(label, screen, p) {
    App.state(label, () => {
      localStorage.setItem('medipos.mockRole', 'admin');
      App.reset('account', {}, 'none');
      if (screen === 'account') return;
      App.go('accounts', {}, 'none');
      if (screen !== 'accounts') App.go(screen, p, 'none');
    }, 'Quản trị');
  }
  preview('Tài khoản (admin)', 'account');
  preview('Danh sách tài khoản', 'accounts');
  preview('Cấp tài khoản', 'accountNew');
  preview('Chi tiết: đang dùng', 'accountDetail', { id: 2 });
  preview('Chi tiết: sửa thông tin', 'accountDetail', { id: 2, edit: true });
  preview('Chi tiết: chờ kích hoạt', 'accountDetail', { id: 4 });
  preview('Chi tiết: đã khoá', 'accountDetail', { id: 5 });
  preview('Chi tiết: chưa có email', 'accountDetail', { id: 6 });
  preview('Chi tiết: chính mình', 'accountDetail', { id: 1 });
})();
