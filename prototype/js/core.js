/* MediPOS Mobile prototype — router, chuyển màn, lớp phủ, helper. Claude giữ file này.
   Màn đăng ký: App.screen(name, { render(p) -> html, mount?(el, p), tab?, statusLight?, cls? })
   Trạng thái QA: App.state(label, run, group) */
(function () {
  const App = (window.App = {});
  const screens = (App.screens = {});
  const states = (App.states = []);
  const cssQ = [];
  let booted = false;

  App.css = (t) => { cssQ.push(t); if (booted) inject(t); };
  function inject(t) { const s = document.createElement('style'); s.textContent = t; document.head.appendChild(s); }
  App.screen = (name, def) => { screens[name] = def; };
  App.state = (label, run, group = 'Khác') => { states.push({ label, run, group }); };

  // ---------- Định dạng ----------
  const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
  App.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.num = (n) => nf.format(n);
  App.money = (n) => nf.format(n) + ' ₫';
  App.pct = (n) => nf.format(n) + '%';
  App.short = (n) => (n >= 1e6 ? nf.format(Math.round(n / 1e5) / 10) + ' tr' : nf.format(Math.round(n / 1e3)) + 'k');

  // ---------- Icon (nét 1.8, một bộ) ----------
  const ICONS = (App.icons = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    chart: '<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-6"/><path d="M21 20H3"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    scan: '<path d="M3 7.5V5.5a2.5 2.5 0 0 1 2.5-2.5h2"/><path d="M16.5 3h2A2.5 2.5 0 0 1 21 5.5v2"/><path d="M21 16.5v2a2.5 2.5 0 0 1-2.5 2.5h-2"/><path d="M7.5 21h-2A2.5 2.5 0 0 1 3 18.5v-2"/><path d="M7 12h10"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17 17h3.5v3.5H17"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    monitor: '<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
    laptop: '<path d="M4.5 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v9h-15z"/><path d="M2 19h20"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0"/><path d="M12 9v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    sliders: '<path d="M4 6h9M19 6h1M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="16" cy="6" r="2.2"/><circle cx="9" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M7 17 17 7M8 7h9v9"/>',
    downRight: '<path d="M7 7l10 10M17 8v9H8"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
    wallet: '<path d="M19 7V5.5A2.5 2.5 0 0 0 16.5 3H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16.5 14h.01"/>',
    truck: '<path d="M2.5 6h11v10h-11zM13.5 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12"/><circle cx="12" cy="10" r="2.5"/>',
    faceid: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1.5M15 9v1.5M12 9v4.5h-1M9.5 16.5a3.6 3.6 0 0 0 5 0"/>',
    finger: '<path d="M12 11v3a7 7 0 0 1-1.6 4.5"/><path d="M8.2 11a3.8 3.8 0 0 1 7.6 0v2a11 11 0 0 1-.8 4.2"/><path d="M5 13.5V11a7 7 0 0 1 12.6-4.2"/><path d="M19 10.5V13a14 14 0 0 1-.5 3.5"/>',
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  });
  App.icon = (name, size = 24, cls = '') =>
    `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;

  // ---------- Logo: giống bản web MediPOS (icon notes-medical của Font Awesome Free, CC BY 4.0) ----------
  // Hai phần để làm hiệu ứng: tờ phiếu có dấu cộng khoét rỗng (lm-doc) và tờ lót phía sau (lm-back).
  const LOGO_DOC = 'M96 352V96c0-35.3 28.7-64 64-64H416c35.3 0 64 28.7 64 64V293.5c0 17-6.7 33.3-18.7 45.3l-58.5 58.5c-12 12-28.3 18.7-45.3 18.7H160c-35.3 0-64-28.7-64-64zM272 128c-8.8 0-16 7.2-16 16v48H208c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h48v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16h-48v-48c0-8.8-7.2-16-16-16H272z';
  const LOGO_BACK = 'M48 120c0-13.3-10.7-24-24-24S0 106.7 0 120V344c0 75.1 60.9 136 136 136H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H136c-48.6 0-88-39.4-88-88V120z';
  App.logoMark = (cls = '') =>
    `<svg class="${cls}" viewBox="-16 0 512 512" fill="currentColor" aria-hidden="true">
      <path class="lm-back" d="${LOGO_BACK}"/><path class="lm-doc" fill-rule="evenodd" d="${LOGO_DOC}"/>
    </svg>`;
  App.appIcon = (cls = '') =>
    `<svg class="${cls}" viewBox="0 0 100 100" aria-label="MediPOS">
      <defs><linearGradient id="aiG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1FB8A7"/><stop offset=".55" stop-color="#0F6F67"/><stop offset="1" stop-color="#0D3F3B"/></linearGradient>
      <radialGradient id="aiH" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="100" height="100" rx="23" fill="url(#aiG)"/><rect width="100" height="100" rx="23" fill="url(#aiH)"/>
      <svg x="21" y="21" width="58" height="58" viewBox="-16 0 512 512" fill="#F4FBFA"><path d="${LOGO_BACK}"/><path fill-rule="evenodd" d="${LOGO_DOC}"/></svg>
    </svg>`;

  // ---------- Khối dựng sẵn ----------
  App.header = ({ title = '', back = true, right = '' } = {}) =>
    `<header class="nav"><div class="nav-side">${back ? `<button class="nav-btn glass tap" data-back aria-label="Quay lại">${App.icon('back', 22)}</button>` : ''}</div>` +
    `<h1 class="nav-title ell">${App.esc(title)}</h1><div class="nav-side end">${right}</div></header>`;
  App.skeleton = (rows = 4) =>
    `<div class="card">${Array.from({ length: rows }, () => `<div class="row"><div class="skel" style="width:36px;height:36px;border-radius:11px"></div><div><div class="skel" style="width:70%"></div><div class="skel" style="width:40%;margin-top:8px;height:12px"></div></div><div class="skel" style="width:56px"></div></div>`).join('')}</div>`;

  // Tải giả: view có .loading → các phần tử [data-skel] thành khối mờ cùng kích thước
  const loaded = new Set();
  App.load = (el, key, ms = 700) => {
    if (loaded.has(key)) return Promise.resolve(false);
    loaded.add(key); el.classList.add('loading');
    return new Promise((r) => setTimeout(() => { el.classList.remove('loading'); r(true); }, ms));
  };

  App.countUp = (el, to, ms = 900, fmt = App.num) => {
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0); requestAnimationFrame(step);
    setTimeout(() => { el.textContent = fmt(to); }, ms + 50); // khung bị ẩn thì rAF không chạy
  };

  // Nút đang xử lý: xám + chữ trạng thái, chặn bấm lại. Trả về hàm khôi phục.
  App.busy = (btn, text) => {
    const html = btn.innerHTML; btn.disabled = true; btn.classList.add('is-busy');
    btn.innerHTML = `<span class="spin"></span>${App.esc(text)}`;
    return () => { btn.disabled = false; btn.classList.remove('is-busy'); btn.innerHTML = html; };
  };

  // ---------- Điều hướng ----------
  let root, views, overlay, dock, stack = [], moving = false;
  const placeholder = (name) => ({
    render: () => App.header({ title: name }) + `<div class="empty"><div class="tile">${App.icon('sliders', 28)}</div>Màn <b>${App.esc(name)}</b> đang được dựng.</div>`,
  });

  function makeView(name, p) {
    const def = screens[name] || placeholder(name);
    const el = document.createElement('section');
    el.className = 'view' + (def.tab ? ' with-dock' : '') + (def.cls ? ' ' + def.cls : '');
    el.dataset.screen = name;
    el.innerHTML = def.render(p || {});
    views.appendChild(el);
    watchScroll(el);
    return { name, p: p || {}, el, def };
  }
  function enter(v) { chrome(v); try { v.def.mount && v.def.mount(v.el, v.p); } catch (e) { console.error(e); } }
  // Quay lại màn cũ: chỉ đổi status bar/dock, KHÔNG mount lại (tránh gắn trùng sự kiện)
  function chrome(v) {
    root.classList.toggle('status-light', !!(typeof v.def.statusLight === 'function' ? v.def.statusLight(v.p) : v.def.statusLight));
    dock.classList.toggle('off', !v.def.tab);
    dock.classList.remove('hidden');
    if (v.def.tab) setTab(v.def.tab);
  }
  function watchScroll(el) {
    let last = 0;
    el.addEventListener('scroll', () => {
      const y = el.scrollTop, nav = el.querySelector('.nav, [data-nav]');
      if (nav) nav.classList.toggle('scrolled', y > 4);
      if (y > 60 && y - last > 6) dock.classList.add('hidden');
      else if (last - y > 6 || y <= 60) dock.classList.remove('hidden');
      last = y;
    }, { passive: true });
  }

  const T = {
    push: [[{ transform: 'translateX(100%)' }, { transform: 'none' }], [{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-28%)', filter: 'brightness(.9)' }], 460, 'to'],
    pop: [[{ transform: 'translateX(-28%)', filter: 'brightness(.9)' }, { transform: 'none', filter: 'brightness(1)' }], [{ transform: 'none' }, { transform: 'translateX(100%)' }], 420, 'from'],
    up: [[{ transform: 'translateY(100%)' }, { transform: 'none' }], [{ transform: 'none' }, { transform: 'scale(.96)', filter: 'brightness(.9)' }], 520, 'to'],
    down: [[{ transform: 'scale(.96)', filter: 'brightness(.9)' }, { transform: 'none', filter: 'brightness(1)' }], [{ transform: 'none' }, { transform: 'translateY(100%)' }], 440, 'from'],
    fade: [[{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], [{ opacity: 1 }, { opacity: 0 }], 260, 'to'],
    reveal: [[{ clipPath: 'circle(0% at 50% 44%)' }, { clipPath: 'circle(120% at 50% 44%)' }], [{ opacity: 1, transform: 'none' }, { opacity: 0.4, transform: 'scale(1.12)' }], 720, 'to'],
  };
  function transition(from, to, mode, dropFrom) {
    const t = T[mode];
    if (!from || !t) { if (from) finish(from, dropFrom); return; }
    moving = mode !== 'fade' && mode !== 'reveal'; // fade/reveal không khóa: state QA hay gọi reset rồi go ngay
    (t[3] === 'to' ? to : from).el.style.zIndex = 2;
    (t[3] === 'to' ? from : to).el.style.zIndex = 1;
    const opt = { duration: t[2], easing: 'cubic-bezier(.22,.8,.24,1)' };
    to.el.animate(t[0], opt);
    from.el.animate(t[1], opt).finished.then(() => { finish(from, dropFrom); to.el.style.zIndex = ''; moving = false; });
    setTimeout(() => { moving = false; }, t[2] + 200); // phòng khi animation bị hủy
  }
  function finish(v, drop) { v.el.style.zIndex = ''; if (drop) v.el.remove(); else v.el.hidden = true; }

  let navAt = 0;
  App.go = (name, p = {}, mode = 'push') => {
    // khóa chống bấm đúp; lệnh gọi liền nhau trong code (state QA reset → go → go) vẫn qua
    if (moving && performance.now() - navAt > 30) return;
    navAt = performance.now();
    const from = stack[stack.length - 1];
    const to = makeView(name, p); to.mode = mode;
    stack.push(to); enter(to); transition(from, to, mode, false);
  };
  App.back = () => {
    if (moving || stack.length < 2) return;
    const from = stack.pop(), to = stack[stack.length - 1];
    to.el.hidden = false; chrome(to);
    transition(from, to, from.mode === 'up' ? 'down' : 'pop', true);
  };
  App.reset = (name, p = {}, mode = 'fade') => {
    navAt = performance.now();
    const from = stack[stack.length - 1];
    stack.slice(0, -1).forEach((v) => v.el.remove());
    const to = makeView(name, p); stack = [to]; enter(to); transition(from, to, mode, true);
  };
  App.tab = (name) => {
    const top = stack[stack.length - 1];
    if (top && top.name === name && stack.length === 1) return top.el.scrollTo({ top: 0, behavior: 'smooth' });
    App.reset(name, {}, 'fade');
  };
  App.current = () => stack[stack.length - 1];
  App.setStatusLight = (on) => root.classList.toggle('status-light', !!on); // màn có dải tối ở đầu, đổi khi cuộn qua

  function setTab(name) {
    const tabs = [...dock.querySelectorAll('.tab')];
    const on = tabs.find((t) => t.dataset.tab === name);
    tabs.forEach((t) => t.classList.toggle('on', t === on));
    const thumb = dock.querySelector('.tab-thumb');
    if (on) { thumb.style.left = on.offsetLeft + 'px'; thumb.style.width = on.offsetWidth + 'px'; }
  }

  // ---------- Lớp phủ ----------
  App.sheet = (html, { onMount, onClose } = {}) => {
    const w = document.createElement('div');
    w.className = 'sheet-wrap';
    w.innerHTML = `<div class="scrim" data-close></div><div class="sheet glass-strong" role="dialog"><div class="grabber"></div>${html}</div>`;
    overlay.appendChild(w); void w.offsetHeight; w.classList.add('open');
    const close = () => { if (!w.isConnected) return; w.classList.remove('open'); setTimeout(() => w.remove(), 400); onClose && onClose(); };
    w.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    onMount && onMount(w.querySelector('.sheet'), close);
    return close;
  };
  App.toast = (text, icon = 'check') => {
    const t = document.createElement('div');
    t.className = 'toast glass-strong'; t.innerHTML = App.icon(icon, 20) + App.esc(text);
    overlay.appendChild(t); void t.offsetHeight; t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 2200);
  };
  App.notify = ({ title, body, onTap, time = 'bây giờ' }) => {
    const b = document.createElement('div');
    b.className = 'banner glass-strong';
    b.innerHTML = `<div class="banner-icon">${App.appIcon()}</div><div><b>${App.esc(title)}</b><span>${App.esc(body)}</span></div><time>${App.esc(time)}</time>`;
    overlay.appendChild(b); void b.offsetHeight; b.classList.add('show');
    const hide = () => { b.classList.remove('show'); setTimeout(() => b.remove(), 500); };
    b.addEventListener('click', () => { hide(); onTap && onTap(); });
    setTimeout(hide, 6000);
  };
  // Mô phỏng hộp thoại Face ID của hệ thống (không phải modal của app). Bảng QA có công tắc cho trường hợp không khớp.
  App.faceIdFail = false;
  App.faceId = () => new Promise((res) => {
    const d = document.createElement('div');
    d.className = 'sysdlg';
    d.innerHTML = `<div class="fid"><svg class="fid-face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS.faceid}</svg>` +
      `<svg class="fid-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5" opacity=".35"/><path pathLength="1" d="m7.5 12.5 3 3 6-6.5"/></svg><span>Face ID</span></div>`;
    overlay.appendChild(d); void d.offsetHeight; d.classList.add('show');
    const box = d.querySelector('.fid'), fail = App.faceIdFail;
    setTimeout(() => {
      if (fail) { box.classList.add('fail'); box.querySelector('span').textContent = 'Không khớp'; }
      else box.classList.add('ok');
      setTimeout(() => { d.classList.remove('show'); setTimeout(() => { d.remove(); res(!fail); }, 220); }, fail ? 900 : 650);
    }, 1100);
  });

  // ---------- Khởi động ----------
  App.boot = () => {
    booted = true; cssQ.forEach(inject);
    const phone = document.querySelector('.phone');
    phone.innerHTML = `<div class="app"><div class="views"></div>
      <div class="statusbar"><span class="num">9:41</span><span class="sb-right">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.2 10.2 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.4 8.4 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.5 0-.9.2-1.2.5L8 11.2l1.2-1.3c-.3-.3-.7-.5-1.2-.5Z"/></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4a2 2 0 0 0 0-4Z" fill="currentColor" opacity=".45"/></svg>
      </span></div>
      <div class="dock off">
        <nav class="tabbar glass"><span class="tab-thumb"></span>
          <button class="tab" data-tab="home">${App.icon('home', 22)}Trang chủ</button>
          <button class="tab" data-tab="revenue">${App.icon('chart', 22)}Doanh thu</button>
          <button class="tab" data-tab="tools">${App.icon('grid', 22)}Tiện ích</button>
          <button class="tab" data-tab="account">${App.icon('user', 22)}Tài khoản</button>
        </nav>
        <button class="scan-btn glass tap" data-go="webScan" data-mode="up" aria-label="Quét mã đăng nhập web">${App.icon('qr', 26)}</button>
      </div>
      <div class="overlay"></div><div class="island"></div><div class="homebar"></div></div>`;
    root = phone.querySelector('.app'); views = root.querySelector('.views');
    overlay = root.querySelector('.overlay'); dock = root.querySelector('.dock');

    root.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go],[data-back],[data-tab]');
      if (!g) return;
      if (g.hasAttribute('data-back')) return App.back();
      if (g.dataset.tab) return App.tab(g.dataset.tab);
      let p = {};
      try { p = g.dataset.p ? JSON.parse(g.dataset.p) : {}; } catch (_) { console.warn('data-p không phải JSON', g.dataset.p); }
      App.go(g.dataset.go, p, g.dataset.mode || 'push');
    });

    // Bảng QA bên trái: nhảy thẳng tới mọi màn/trạng thái
    const qa = document.querySelector('.qa');
    if (qa) {
      const groups = {};
      states.forEach((s, i) => { (groups[s.group] = groups[s.group] || []).push(`<button data-i="${i}">${App.esc(s.label)}</button>`); });
      qa.innerHTML = `<div class="qa-brand">${App.appIcon()}<div><b>MediPOS Mobile</b><span>Prototype v0.1</span></div></div>` +
        Object.entries(groups).map(([g, b]) => `<div class="qa-group"><h4>${App.esc(g)}</h4>${b.join('')}</div>`).join('') +
        `<label><input type="checkbox" id="qaFidFail"> Face ID không khớp</label>` +
        `<div class="qa-group"><h4>Thương hiệu</h4><button onclick="location.href='logo.html'">Bộ logo</button></div>`;
      qa.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) states[+b.dataset.i].run(); });
      qa.querySelector('#qaFidFail').addEventListener('change', (e) => { App.faceIdFail = e.target.checked; });
    }
    const start = decodeURIComponent(location.hash.slice(1));
    App.reset(screens[start] ? start : 'splash', {}, 'none');
  };
})();
