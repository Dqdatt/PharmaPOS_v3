/* API: lớp duy nhất các màn gọi để đăng nhập / đọc dữ liệu thật. Claude giữ — nhân viên KHÔNG sửa.
   - Live local: chạy từ localhost / IP LAN → Supabase local cùng máy (http://<host>:54321); tunnel → cùng origin.
   - Live thật: Netlify (medipos-app.netlify.app, tự deploy từ main) → Supabase thật. CHỈ gộp main khi DB thật đã có migration mới (bước M9).
   - Mock: chỗ khác → dữ liệu giả, mã OTP đúng là 123456.
   Mọi hàm trả Promise<{ ok: true, ...data } | { ok: false, error: 'câu tiếng Việt' }>, không throw. */
(function () {
  const host = location.hostname;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/.test(host);
  // Test iPhone qua HTTPS tunnel (pwa/tools/serve.mjs chuyển tiếp Supabase cùng origin)
  const tunnel = /\.trycloudflare\.com$/.test(host);
  // DB thật: URL + publishable key công khai được (RLS chặn dữ liệu), giống VITE_SUPABASE_* của POS trên Netlify
  const prod = host === 'medipos-app.netlify.app';
  const live = !!window.supabase && ((isLocal && location.protocol === 'http:') || tunnel || prod);
  const sb = live ? window.supabase.createClient(
    prod ? 'https://fbppvryvfdeohocsgwtl.supabase.co' : tunnel ? location.origin : `http://${host}:54321`,
    prod ? 'sb_publishable_ibuBoFC6QpW4t2CMVqElfw_mqUYUd5r'
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0', // key demo công khai của CLI local
    { auth: { storageKey: 'medipos.auth', persistSession: true, autoRefreshToken: true } }) : null;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASS = 8;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function msg(e) {
    const m = String((e && e.message) || e || '');
    let n;
    if (/invalid login credentials/i.test(m)) return 'Email hoặc mật khẩu không đúng';
    if (/token has expired|invalid.*(otp|token)|otp.*(expired|invalid)/i.test(m)) return 'Mã không đúng hoặc đã hết hạn';
    if (/signups not allowed|user not found/i.test(m)) return 'Email này chưa được cấp tài khoản';
    if ((n = m.match(/after (\d+) seconds?/i))) return `Vui lòng đợi ${n[1]} giây rồi gửi lại`;
    if (/rate limit|too many/i.test(m)) return 'Thử quá nhiều lần, vui lòng đợi một lát';
    if (/should be different/i.test(m)) return 'Mật khẩu mới phải khác mật khẩu cũ';
    if (/password.*(at least|characters|weak)/i.test(m)) return `Mật khẩu cần ít nhất ${MIN_PASS} ký tự`;
    if (/failed to fetch|network|load failed/i.test(m)) return 'Không kết nối được máy chủ';
    return 'Có lỗi xảy ra, vui lòng thử lại';
  }
  const fail = (e) => ({ ok: false, error: typeof e === 'string' ? e : msg(e) });
  const normEmail = (s) => String(s || '').trim().toLowerCase();
  const badEmail = (email) => (EMAIL_RE.test(email) ? null : 'Email không hợp lệ');
  const badPass = (p) => (String(p || '').length >= MIN_PASS ? null : `Mật khẩu cần ít nhất ${MIN_PASS} ký tự`);

  let me = null; // hồ sơ người đang đăng nhập (live), đọc qua API.me()
  let dash = null; // { at, r }: kết quả API.dashboard gần nhất (xoá khi đăng xuất)
  async function readProfile() {
    const { data, error } = await sb.rpc('my_profile');
    if (error) throw error;
    return data && data[0] ? data[0] : null;
  }
  // Sau khi có phiên: kiểm trạng thái, khoá thì đăng xuất luôn
  async function afterAuth() {
    const profile = await readProfile();
    if (!profile) { await sb.auth.signOut({ scope: 'local' }); return fail('Email này chưa được cấp tài khoản'); }
    if (profile.status === 'locked') { await sb.auth.signOut({ scope: 'local' }); return fail('Tài khoản đã bị khoá, vui lòng liên hệ admin'); }
    if (!me || me.id !== profile.id) dash = null; // số liệu của người trước
    me = profile;
    API.push.keep();
    return { ok: true, profile };
  }

  // ---------- Passkey WebAuthn (Face ID thật), xác minh ở Edge Function `passkey` ----------
  // { [users.id]: credential id }: passkey của từng tài khoản trên máy này (live) → đổi tài khoản không phải bật lại Face ID; mock dùng cờ medipos.bio
  const PK_KEY = 'medipos.passkeys';
  const pkAll = () => { try { const v = JSON.parse(localStorage.getItem(PK_KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const pkSet = (uid, id) => { const m = pkAll(); if (id) m[uid] = id; else delete m[uid]; localStorage.setItem(PK_KEY, JSON.stringify(m)); };
  const pkLocal = () => { const id = me && pkAll()[me.id]; return id ? { id, uid: me.id } : null; }; // của tài khoản đang đăng nhập
  try { const o = JSON.parse(localStorage.getItem('medipos.passkey')); if (o && o.id && o.uid) pkSet(o.uid, o.id); } catch (e) { /* bỏ */ }
  localStorage.removeItem('medipos.passkey'); // bản cũ chỉ nhớ 1 passkey/máy
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
  const pkSupported = () => !!(window.isSecureContext && window.PublicKeyCredential && navigator.credentials);
  const ids = (list) => (list || []).map((x) => ({ ...x, id: unb64u(x.id) }));
  const credJSON = (c, response) => ({ id: c.id, rawId: b64u(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment || undefined,
    clientExtensionResults: c.getClientExtensionResults(), response });

  async function pkCreate(o) {
    const c = await navigator.credentials.create({ publicKey: { ...o, challenge: unb64u(o.challenge), user: { ...o.user, id: unb64u(o.user.id) }, excludeCredentials: ids(o.excludeCredentials) } });
    const r = c.response;
    return credJSON(c, { clientDataJSON: b64u(r.clientDataJSON), attestationObject: b64u(r.attestationObject), transports: r.getTransports ? r.getTransports() : [] });
  }
  async function pkGet(o) {
    const c = await navigator.credentials.get({ publicKey: { ...o, challenge: unb64u(o.challenge), allowCredentials: ids(o.allowCredentials) } });
    const r = c.response;
    return credJSON(c, { clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature),
      userHandle: r.userHandle ? b64u(r.userHandle) : undefined });
  }
  // Gọi Edge Function; lỗi ném Error mang câu tiếng Việt + code của server
  const pkFn = (body) => callFn('passkey', body);
  // Gọi Edge Function; lỗi có câu tiếng Việt từ server → err.vi
  async function callFn(name, body) {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (!error) return data;
    let j = null;
    try { j = await error.context.json(); } catch (e) { /* lỗi mạng: không có body */ }
    const err = new Error((j && j.error) || error.message);
    if (j && j.error) { err.vi = true; err.code = j.code; }
    throw err;
  }
  // retry = true: Face ID không khớp / người dùng huỷ → cho thử lại
  function pkFail(e) {
    const name = e && e.name;
    if (name === 'NotAllowedError' || name === 'AbortError') return { ok: false, retry: true, cancel: true, error: 'Face ID không thành công, vui lòng thử lại' };
    if (name === 'SecurityError' || name === 'NotSupportedError') return fail('Địa chỉ này không dùng được Face ID');
    if (e && e.vi) return { ok: false, error: e.message, code: e.code, retry: e.code === 'bio_failed' };
    return fail(e);
  }
  const mockFace = async (error) => ((await App.faceId()) ? { ok: true } : { ok: false, retry: true, error });

  // ---------- Thông báo đẩy (Web Push), gửi ở Edge Function `push` ----------
  const UA = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const pushReg = async () => { try { return pushSupported() ? await navigator.serviceWorker.getRegistration() : null; } catch (e) { return null; } };
  const PUSH_OFF = 'medipos.pushOff'; // '1' = người dùng tự tắt thông báo trên máy này
  let pushKey = null; // tải trước khoá VAPID (lúc đọc trạng thái) để sau khi bấm Bật không phải chờ mạng
  const loadKey = () => pushKey || (pushKey = sb.functions.invoke('push', { body: { action: 'key' } })
    .then(({ data }) => (data && data.key ? unb64u(data.key) : null), () => null)
    .then((k) => { if (!k) pushKey = null; return k; }));
  const prefsOut = (r) => ({ revenue: r.revenue, debt: r.debt, lowStock: r.low_stock, expiring: r.expiring, expiryDays: r.expiry_days });
  const prefsIn = (p) => {
    const o = {};
    for (const [k, col] of [['revenue', 'revenue'], ['debt', 'debt'], ['lowStock', 'low_stock'], ['expiring', 'expiring']]) if (k in p) o[col] = !!p[k];
    if ('expiryDays' in p) o.expiry_days = Number(p.expiryDays);
    return o;
  };
  const mockPrefs = { revenue: true, debt: true, lowStock: true, expiring: true, expiryDays: 30 };
  let mockList = null;
  const mockNotifs = () => mockList || (mockList = (DATA.notifications || []).map((n) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(n.time || ''), t = new Date();
    if (m) t.setHours(+m[1], +m[2], 0, 0); else t.setDate(t.getDate() - (n.daysAgo || 1));
    return { id: n.id, kind: n.kind, title: n.title, body: n.body || '', at: t.getTime(), unread: !!n.unread };
  }));
  // Thông báo vừa bấm để mở app: ?notif=<kind> (app chưa mở) hoặc tin nhắn từ sw.js (app đang mở)
  let opened = new URLSearchParams(location.search).get('notif');
  if (opened !== null) history.replaceState(null, '', location.pathname + location.hash);
  const openFns = [];
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'medipos-notif') return;
    opened = null;
    openFns.forEach((fn) => { try { fn(String(e.data.kind || '')); } catch (err) { console.error(err); } });
  });

  // User-Agent → { browser, os } (màn xác nhận đăng nhập POS, danh sách phiên POS)
  function uaInfo(ua) {
    ua = ua || '';
    return {
      browser: /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt',
      os: /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) && !/Mobile/.test(ua) ? 'macOS'
        : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Máy tính',
    };
  }
  const p2 = (n) => String(n).padStart(2, '0');
  const hhmm = (t) => `${p2(t.getHours())}:${p2(t.getMinutes())}`;
  const whenText = (t) => `${hhmm(t)} ${t.toDateString() === new Date().toDateString() ? 'hôm nay' : `${p2(t.getDate())}/${p2(t.getMonth() + 1)}`}`;
  function agoText(t) {
    const m = Math.floor((Date.now() - t.getTime()) / 60000);
    return m < 1 ? 'vừa xong' : m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.floor(m / 60)} giờ trước` : `${Math.floor(m / 1440)} ngày trước`;
  }
  const ROLE_ERR = { not_allowed: 'Chỉ admin được làm việc này', self: 'Không thể tự khoá hoặc đổi quyền tài khoản của mình',
    not_found: 'Không tìm thấy tài khoản', bad_role: 'Vai trò chỉ được là Quản lý hoặc Nhân viên',
    no_email: 'Gắn email cho tài khoản này trước' };
  const fnFail = (e) => fail(e && e.vi ? e.message : e);

  async function adminSet(id, role, lock) {
    if (!live) { await wait(600); return { ok: true }; }
    try {
      const { data, error } = await sb.rpc('admin_set_user', { target: id, new_role: role, lock });
      if (error) return fail(error);
      return data === 'ok' ? { ok: true } : fail(ROLE_ERR[data] || 'Có lỗi xảy ra, vui lòng thử lại');
    } catch (e) { return fail(e); }
  }

  // mock: bảng QA đặt localStorage['medipos.mockRole'] = 'admin' | 'staff' để xem màn theo vai trò
  const MOCK_PROFILE = () => ({ id: 0, name: DATA.owner.name, role: localStorage.getItem('medipos.mockRole') || 'manager', status: 'active', email: 'demo@medipos.vn', phone: '84903128466' });
  let mockStatus = 'invited';

  const API = (window.API = {
    live,
    MIN_PASS,
    /** Hồ sơ đã đăng nhập { id, name, role: admin|manager|staff, ... } hoặc null. Mock: luôn là QL. */
    me: () => (live ? me : MOCK_PROFILE()),

    /** Gửi mã 6 số qua email (lần đầu đăng nhập hoặc quên mật khẩu). */
    async sendCode(email) {
      email = normEmail(email);
      const bad = badEmail(email); if (bad) return fail(bad);
      if (!live) { await wait(600); return { ok: true, email }; }
      try {
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        return error ? fail(error) : { ok: true, email };
      } catch (e) { return fail(e); }
    },

    /** Xác minh mã. profile.status === 'invited' → bắt buộc sang màn tạo mật khẩu. */
    async verifyCode(email, code) {
      email = normEmail(email);
      if (!/^\d{6}$/.test(String(code || ''))) return fail('Mã gồm 6 chữ số');
      if (!live) { await wait(600); return code === '123456' ? { ok: true, profile: { ...MOCK_PROFILE(), status: mockStatus } } : fail('Mã không đúng hoặc đã hết hạn'); }
      try {
        const { error } = await sb.auth.verifyOtp({ email, token: String(code), type: 'email' });
        return error ? fail(error) : await afterAuth();
      } catch (e) { return fail(e); }
    },

    /** Đặt / đổi mật khẩu cho phiên hiện tại (sau verifyCode). Lần đầu: server tự chuyển invited → active. */
    async setPassword(password) {
      const bad = badPass(password); if (bad) return fail(bad);
      if (!live) { await wait(600); mockStatus = 'active'; return { ok: true, profile: MOCK_PROFILE() }; }
      try {
        const { error } = await sb.auth.updateUser({ password });
        return error ? fail(error) : await afterAuth();
      } catch (e) { return fail(e); }
    },

    /** Đăng nhập email + mật khẩu. */
    async signIn(email, password) {
      email = normEmail(email);
      const bad = badEmail(email) || (password ? null : 'Vui lòng nhập mật khẩu'); if (bad) return fail(bad);
      if (!live) { await wait(600); return password.length >= MIN_PASS ? { ok: true, profile: MOCK_PROFILE() } : fail('Email hoặc mật khẩu không đúng'); }
      try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return fail(error);
        const r = await afterAuth();
        if (r.ok && r.profile.status === 'invited') { await sb.auth.signOut({ scope: 'local' }); return fail('Tài khoản chưa kích hoạt, chọn "Quên mật khẩu" để nhận mã'); }
        return r;
      } catch (e) { return fail(e); }
    },

    /** Hồ sơ người đang đăng nhập (đọc lại từ server), null nếu chưa đăng nhập / phiên hết hạn. */
    async profile() {
      if (!live) return null;
      try {
        const { data } = await sb.auth.getSession();
        if (!data.session) return null;
        const p = await readProfile();
        if (!p || p.status === 'locked') { await sb.auth.signOut({ scope: 'local' }); return null; }
        me = p;
        API.push.keep();
        return p;
      } catch (e) { return null; }
    },

    async signOut() {
      await API.push.disable(false); // máy dùng chung không nhận thông báo của người trước
      // Face ID (passkey) của tài khoản vẫn nhớ trên máy: đăng nhập lại vẫn cần mật khẩu / mã, xong là có Face ID ngay
      localStorage.removeItem('medipos.applock');
      me = null; dash = null;
      if (live) { try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* vẫn xoá phiên cục bộ */ } }
      return { ok: true };
    },

    /** Đăng nhập POS web bằng app. Nội dung QR trên POS: `medipos-login:<uuid>`. */
    webLogin: {
      /** Đọc nội dung QR → id yêu cầu, hoặc null nếu không phải mã MediPOS. */
      parse(text) {
        const m = String(text || '').trim().match(/^medipos-login:([0-9a-f-]{36})$/i);
        return m ? m[1].toLowerCase() : null;
      },
      /** Thông tin máy tính đang xin đăng nhập: { ok, request: { browser, os, ip, time, expiresAt } }. */
      async info(id) {
        if (!live) { await wait(500); const r = DATA.webRequest; return { ok: true, request: { browser: r.browser, os: r.os, ip: r.ip, time: r.time, expiresAt: Date.now() + r.expiresIn * 1000 } }; }
        try {
          const { data, error } = await sb.rpc('web_login_info', { req_id: id });
          if (error) return fail(error);
          const r = data && data[0];
          if (!r) return fail('Mã đã hết hạn hoặc đã được dùng, hãy tải lại mã trên máy tính');
          return { ok: true, request: { ...uaInfo(r.user_agent), ip: r.ip || '', time: hhmm(new Date(r.created_at)), expiresAt: new Date(r.expires_at).getTime() } };
        } catch (e) { return fail(e); }
      },
      /** Duyệt bằng Face ID: passkey xác minh ở server (bắt buộc đã bật Face ID trên máy này). */
      async approve(id) {
        if (!live) return mockFace('Face ID không khớp');
        if (!pkLocal() || !pkSupported()) return fail('Bật Face ID trong Tài khoản để duyệt đăng nhập POS');
        try {
          const opts = await pkFn({ action: 'approve-options', id });
          await pkFn({ action: 'approve', id, response: await pkGet(opts) });
          return { ok: true };
        } catch (e) {
          if (e && e.code === 'need_bio' && me) pkSet(me.id); // server đã xoá passkey (bị khoá rồi mở lại) → màn Tài khoản hiện Face ID tắt
          return pkFail(e);
        }
      },
      /** Từ chối (approve=false). Duyệt chỉ qua approve() ở trên — server trả need_passkey nếu gọi decide(id, true). */
      async decide(id, approve) {
        if (!live) { await wait(600); return { ok: true }; }
        try {
          const { data, error } = await sb.rpc('web_login_decide', { req_id: id, approve: !!approve });
          if (error) return fail(error);
          if (data === 'rejected') return { ok: true };
          if (data === 'admin_blocked') return fail('Tài khoản quản trị chỉ dùng app, không đăng nhập POS');
          if (data === 'expired') return fail('Mã đã hết hạn, hãy tải lại mã trên máy tính');
          return fail('Tài khoản chưa có quyền đăng nhập POS');
        } catch (e) { return fail(e); }
      },
    },

    /** Số liệu Trang chủ / Doanh thu / Tiện ích, cùng khuôn DATA: { ok, role, today, week, month, invoices (hôm nay),
     *  shifts, lowStock, payables (NV: rỗng), expiring (chưa có, bước C) }. Doanh thu = net bán lẻ như ô POS.
     *  Dùng lại kết quả trong 30 giây (chuyển tab không tải lại); fresh = true để tải mới. */
    async dashboard(fresh) {
      if (!fresh && dash && Date.now() - dash.at < 30000) return dash.r;
      let r;
      if (!live) {
        await wait(500);
        const { today, week, month, invoices, shifts, lowStock, payables, expiring } = DATA;
        r = { ok: true, role: MOCK_PROFILE().role, today, week, month, invoices, shifts, lowStock, payables, expiring };
      } else {
        try { r = { ok: true, ...(await callFn('dashboard', {})) }; } catch (e) { r = fnFail(e); }
      }
      dash = r.ok ? { at: Date.now(), r } : null;
      return r;
    },

    /** Chi tiết 1 hoá đơn: { ok, invoice: { id, time: 'HH:MM', date: 'DD/MM/YYYY', staff, pay, total, otherCosts, deleted,
     *  note, customer: { name, phone: '0912 *** 208' } | null, items: [{ name, unit, price, qty }] } } */
    async invoice(id) {
      if (!live) {
        await wait(400);
        const iv = DATA.invoices.find((x) => x.id === id);
        if (!iv) return fail('Không tìm thấy hoá đơn');
        const price = Math.round(iv.total / iv.items.length);
        return { ok: true, invoice: { id, time: iv.time, date: '', staff: iv.staff, pay: iv.pay, total: iv.total, otherCosts: 0, deleted: false,
          note: '', customer: null, items: iv.items.map((name) => ({ name, unit: '', price, qty: 1 })) } };
      }
      try {
        const { data: r, error } = await sb.from('invoices')
          .select('id, time, employee_name, customer_name, customer_phone, method, other_costs, total, status, note, invoice_items(name, unit, price, qty)')
          .eq('id', id).maybeSingle();
        if (error) return fail(error);
        if (!r) return fail('Không tìm thấy hoá đơn');
        const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(r.time || '');
        const ph = String(r.customer_phone || '').replace(/\D/g, '').replace(/^84/, '0');
        return { ok: true, invoice: {
          id: r.id, time: m ? `${p2(m[1])}:${m[2]}` : '', date: m ? `${p2(m[3])}/${p2(m[4])}/${m[5]}` : '',
          staff: r.employee_name || '', pay: { cash: 'Tiền mặt', transfer: 'Chuyển khoản', card: 'Thẻ' }[r.method] || 'Khác',
          total: Number(r.total), otherCosts: Number(r.other_costs) || 0, deleted: r.status === 'deleted', note: r.note || '',
          customer: r.customer_name || ph ? { name: r.customer_name || 'Khách lẻ', phone: ph.length >= 7 ? `${ph.slice(0, 4)} *** ${ph.slice(-3)}` : '' } : null,
          items: (r.invoice_items || []).map((x) => ({ name: x.name, unit: x.unit || '', price: Number(x.price), qty: Number(x.qty) })),
        } };
      } catch (e) { return fail(e); }
    },

    /** Tra tồn kho theo tên: { ok, products: [{ id, name, unit, price, left }] } (tối đa 30). */
    async searchProducts(q) {
      q = String(q || '').replace(/[%_*,()\\]/g, ' ').trim();
      if (!live) {
        await wait(300);
        const k = q.toLowerCase();
        return { ok: true, products: DATA.lowStock.filter((x) => x.name.toLowerCase().includes(k))
          .map((x, i) => ({ id: i + 1, name: x.name, unit: x.unit, price: 0, left: x.left })) };
      }
      if (!q) return { ok: true, products: [] };
      try {
        const { data, error } = await sb.from('products').select('id, name, unit, sell_price, initial_stock, total_in, total_out')
          .ilike('name', `%${q}%`).order('name').limit(30);
        if (error) return fail(error);
        return { ok: true, products: data.map((x) => ({ id: x.id, name: x.name, unit: x.unit || '', price: Number(x.sell_price) || 0,
          left: Number(x.initial_stock) + Number(x.total_in) - Number(x.total_out) })) };
      } catch (e) { return fail(e); }
    },

    /** Phiên POS đang mở (của mình; admin: của mọi người). */
    webSessions: {
      /** → { ok, sessions: [{ id, userName, browser, os, ip, since: '08:12 hôm nay', lastActive: '2 phút trước' }] } */
      async list() {
        if (!live) { await wait(500); return { ok: true, sessions: DATA.webSessions.map((w) => ({ ...w, userName: DATA.owner.name })) }; }
        try {
          const { data, error } = await sb.rpc('web_sessions');
          if (error) return fail(error);
          return { ok: true, sessions: data.map((r) => ({ id: r.id, userName: r.user_name, ...uaInfo(r.user_agent), ip: r.ip || '',
            since: whenText(new Date(r.login_at)), lastActive: agoText(new Date(r.last_seen || r.login_at)) })) };
        } catch (e) { return fail(e); }
      },
      /** Đăng xuất 1 máy POS (có hiệu lực ngay). */
      async revoke(id) {
        if (!live) { await wait(600); return { ok: true }; }
        try {
          const { data, error } = await sb.rpc('web_session_revoke', { req_id: id });
          if (error) return fail(error);
          return data ? { ok: true } : fail('Phiên này đã đăng xuất');
        } catch (e) { return fail(e); }
      },
    },

    /** Admin quản lý tài khoản (chỉ admin; server kiểm quyền). user = { id, name, role, status, email, phone, createdAt } */
    admin: {
      async list() {
        if (!live) { await wait(500); return { ok: true, users: (DATA.accounts || []).map((u) => ({ ...u })) }; }
        try {
          const { data, error } = await sb.from('users').select('id, name, role, status, email, phone, created_at').order('id');
          if (error) return fail(error);
          return { ok: true, users: data.map(({ created_at, ...u }) => ({ ...u, createdAt: created_at })) };
        } catch (e) { return fail(e); }
      },
      /** Cấp tài khoản mới (role: manager|staff). Người được cấp tự nhận mã qua email lần đầu đăng nhập. */
      async create({ name, email, role, phone }) {
        email = normEmail(email);
        const bad = (String(name || '').trim().length < 2 ? 'Nhập họ tên' : null) || badEmail(email)
          || (role === 'manager' || role === 'staff' ? null : 'Chọn vai trò'); if (bad) return fail(bad);
        if (!live) { await wait(600); return { ok: true, user: { id: Date.now(), name, email, role, phone: phone || null, status: 'invited' } }; }
        try { return { ok: true, user: (await callFn('admin-create-user', { name, email, role, phone })).user }; } catch (e) { return fnFail(e); }
      },
      /** Gắn email cho tài khoản cũ chưa có email (giữ nguyên lịch sử bán hàng). */
      async linkEmail(id, email) {
        email = normEmail(email);
        const bad = badEmail(email); if (bad) return fail(bad);
        if (!live) { await wait(600); return { ok: true, user: { id, email, status: 'invited' } }; }
        try { return { ok: true, user: (await callFn('admin-create-user', { id, email })).user }; } catch (e) { return fnFail(e); }
      },
      /** Sửa họ tên / email QL, NV (đổi luôn email đăng nhập). Chỉ gửi trường muốn đổi. → { ok, user } */
      async update(id, { name, email } = {}) {
        const body = { action: 'edit', id };
        if (name !== undefined) body.name = String(name).trim();
        if (email !== undefined) body.email = normEmail(email);
        const bad = (body.name !== undefined && (body.name.length < 2 || body.name.length > 80) ? 'Tên cần 2–80 ký tự' : null)
          || (body.email !== undefined ? badEmail(body.email) : null)
          || (body.name === undefined && body.email === undefined ? 'Không có gì để sửa' : null);
        if (bad) return fail(bad);
        if (!live) { await wait(600); return { ok: true, user: { id, ...(body.name ? { name: body.name } : {}), ...(body.email ? { email: body.email } : {}) } }; }
        try { return { ok: true, user: (await callFn('admin-create-user', body)).user }; } catch (e) { return fnFail(e); }
      },
      /** Đổi vai trò (manager|staff). */
      setRole: (id, role) => adminSet(id, role, null),
      /** Khoá: đăng xuất mọi máy, tắt Face ID + thông báo của người đó. */
      lock: (id) => adminSet(id, null, true),
      unlock: (id) => adminSet(id, null, false),
    },

    /** Face ID = passkey WebAuthn (live); mock dùng App.faceId() mô phỏng. Mọi hàm trả { ok } | { ok: false, error, retry? }. */
    bio: {
      enabled: () => (live ? !!pkLocal() : localStorage.getItem('medipos.bio') === '1'),
      /** Bật Face ID: tạo passkey trên máy + lưu ở server (cần đang đăng nhập). */
      async enable() {
        if (!live) {
          const r = await mockFace('Face ID không khớp. Thử lại hoặc để sau.');
          if (r.ok) localStorage.setItem('medipos.bio', '1');
          return r;
        }
        if (!pkSupported()) return fail('Máy này không dùng được Face ID');
        try {
          const opts = await pkFn({ action: 'register-options' });
          const r = await pkFn({ action: 'register', response: await pkCreate(opts) });
          pkSet(r.user_id, r.credential);
          return { ok: true };
        } catch (e) { return pkFail(e); }
      },
      /** Mở khoá app: server xác minh passkey rồi cấp phiên mới → { ok, profile }. */
      async unlock() {
        if (!live) return mockFace('Face ID không khớp');
        const pk = pkLocal();
        if (!pk || !pkSupported()) return fail('Face ID chưa bật trên máy này');
        try {
          const opts = await pkFn({ action: 'login-options', credential: pk.id });
          const r = await pkFn({ action: 'login', response: await pkGet(opts) });
          const { error } = await sb.auth.setSession(r.session);
          return error ? fail(error) : await afterAuth();
        } catch (e) {
          if (e && e.code === 'unknown') pkSet(pk.uid);
          return pkFail(e);
        }
      },
      /** Tắt Face ID máy này: xoá passkey ở server (passkey trong Keychain còn nhưng hết hiệu lực). */
      async disable() {
        localStorage.removeItem('medipos.bio');
        localStorage.removeItem('medipos.applock'); // không còn Face ID thì không khoá app (kể cả khi đăng xuất)
        const pk = live && pkLocal();
        if (!pk) return { ok: true };
        try {
          await pkFn({ action: 'delete', credential: pk.id });
          pkSet(pk.uid);
          return { ok: true };
        } catch (e) {
          if (e && e.vi) pkSet(pk.uid); // phiên hết hạn: server không xoá được, máy này vẫn tắt
          return e && e.vi ? { ok: true } : pkFail(e);
        }
      },
    },

    /** Thông báo đẩy trên máy này. Đăng nhập POS luôn báo; các loại khác theo prefs. */
    push: {
      /** 'unsupported' | 'install' (iPhone: phải Thêm vào Màn hình chính) | 'denied' (đã chặn trong Cài đặt) | 'off' | 'on' */
      async status() {
        if (!live) return localStorage.getItem('medipos.push') === '1' ? 'on' : 'off';
        if (!pushSupported()) return isIOS && !standalone() ? 'install' : 'unsupported';
        const reg = await pushReg();
        if (!reg) return 'unsupported';
        if (Notification.permission === 'denied') return 'denied';
        let sub = null;
        try { sub = Notification.permission === 'granted' ? await reg.pushManager.getSubscription() : null; } catch (e) { /* coi như chưa bật */ }
        // Đã bật: đăng ký lại cho khớp tài khoản đang đăng nhập (server có thể đã xoá endpoint)
        if (sub) sb.rpc('push_subscribe', { sub: sub.toJSON(), ua: UA }).then(() => {}, () => {});
        else loadKey();
        return sub ? 'on' : 'off';
      },
      /** Bật: gọi NGAY trong sự kiện bấm (iOS chỉ hỏi quyền khi người dùng vừa bấm). Từ chối → { ok: false, denied }. */
      async enable() {
        if (!live) { await wait(500); localStorage.setItem('medipos.push', '1'); return { ok: true }; }
        if (!pushSupported()) return fail(isIOS && !standalone() ? 'Thêm MediPOS vào Màn hình chính để nhận thông báo' : 'Máy này không nhận được thông báo');
        try {
          const perm = await Notification.requestPermission(); // trước mọi await khác
          if (perm !== 'granted') return { ok: false, denied: perm === 'denied', error: 'MediPOS chưa được phép gửi thông báo' };
          const reg = await pushReg();
          const key = reg && await loadKey();
          if (!reg) return fail('Máy này không nhận được thông báo');
          if (!key) return fail('Máy chủ chưa bật thông báo');
          const old = await reg.pushManager.getSubscription();
          if (old) await old.unsubscribe(); // khoá VAPID có thể đã đổi
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
          const { data, error } = await sb.rpc('push_subscribe', { sub: sub.toJSON(), ua: UA });
          if (error || data !== true) { await sub.unsubscribe(); return error ? fail(error) : fail('Không bật được thông báo trên máy này'); }
          localStorage.removeItem(PUSH_OFF);
          return { ok: true };
        } catch (e) { return fail(e); }
      },
      /** Tắt trên máy này. byUser = false khi đăng xuất: đăng nhập lại thì keep() tự bật lại. */
      async disable(byUser = true) {
        localStorage.removeItem('medipos.push');
        if (byUser) localStorage.setItem(PUSH_OFF, '1');
        if (!live) return { ok: true };
        try {
          const reg = await pushReg();
          const sub = reg && await reg.pushManager.getSubscription();
          if (!sub) return { ok: true };
          await sb.rpc('push_unsubscribe', { endpoint: sub.endpoint }); // lỗi (hết phiên) cũng không sao: huỷ ở máy → server xoá khi gặp 410
          await sub.unsubscribe();
          return { ok: true };
        } catch (e) { return fail(e); }
      },
      /** Máy đã cho phép thông báo → tự đăng ký lại cho tài khoản đang đăng nhập (mở app, đăng nhập lại), không cần bấm Bật lại.
       *  Người dùng tự tắt trong app (PUSH_OFF) hoặc chặn trong Cài đặt iPhone thì thôi. Không chờ, không báo lỗi. */
      async keep() {
        if (!live || !pushSupported() || Notification.permission !== 'granted' || localStorage.getItem(PUSH_OFF) === '1') return;
        try {
          const reg = await pushReg();
          if (!reg) return;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const key = await loadKey();
            if (!key) return;
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
          }
          await sb.rpc('push_subscribe', { sub: sub.toJSON(), ua: UA });
        } catch (e) { /* iOS có thể đòi bấm mới đăng ký được → màn Thông báo vẫn hiện nút Bật */ }
      },
      /** Đọc (không truyền gì) hoặc lưu cài đặt của tài khoản. prefs = { revenue, debt, lowStock, expiring, expiryDays: 15|30|60|90 } */
      async prefs(changes) {
        if (!live) { await wait(300); Object.assign(mockPrefs, changes || {}); return { ok: true, prefs: { ...mockPrefs } }; }
        try {
          const { data, error } = await sb.rpc('my_notif_prefs', { changes: prefsIn(changes || {}) });
          return error ? fail(error) : { ok: true, prefs: prefsOut(data) };
        } catch (e) { return fail(e); }
      },
      /** kind của thông báo vừa bấm để mở app (null nếu không), chỉ trả 1 lần. Gọi sau khi vào được app. */
      takeOpened() { const k = opened; opened = null; return k; },
      /** fn(kind) khi người dùng bấm thông báo lúc app đang mở. */
      onOpen(fn) { openFns.push(fn); },
    },

    /** Thông báo đã nhận (màn Thông báo). item = { id, kind: web|revenue|debt|stock|expiry, title, body, at (ms), unread } */
    notifications: {
      async list() {
        if (!live) { await wait(400); return { ok: true, items: mockNotifs().map((n) => ({ ...n })) }; }
        try {
          const { data, error } = await sb.from('notifications').select('id, kind, title, body, created_at, read_at')
            .order('created_at', { ascending: false }).limit(50);
          if (error) return fail(error);
          return { ok: true, items: data.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body || '', at: new Date(n.created_at).getTime(), unread: !n.read_at })) };
        } catch (e) { return fail(e); }
      },
      /** Đánh dấu đã đọc: ids = mảng id, bỏ trống = tất cả. */
      async read(ids) {
        if (!live) { mockNotifs().forEach((n) => { if (!ids || ids.includes(n.id)) n.unread = false; }); return { ok: true }; }
        try {
          const { error } = await sb.rpc('notifications_read', { ids: ids && ids.length ? ids : null });
          return error ? fail(error) : { ok: true };
        } catch (e) { return fail(e); }
      },
    },
  });

  // Phiên bị thu hồi / hết hạn / tài khoản bị khoá khi app đang mở → về màn Đăng nhập.
  // API.signOut() xoá `me` trước nên tự đăng xuất không đi qua đây.
  if (sb) {
    sb.auth.onAuthStateChange((ev) => {
      if (ev !== 'SIGNED_OUT' || !me) return;
      me = null; dash = null;
      setTimeout(() => { // không gọi App/supabase ngay trong callback auth
        if (!window.App || !App.screens.login) return;
        App.reset('login', {}, 'fade');
        App.toast('Phiên đăng nhập đã hết, vui lòng đăng nhập lại', 'alert');
      });
    });
    // Mở lại app: kiểm lại tài khoản (bị khoá → profile() đăng xuất → về Đăng nhập). Mất mạng thì giữ nguyên.
    document.addEventListener('visibilitychange', () => { if (!document.hidden && me) API.profile(); });
  }
})();
