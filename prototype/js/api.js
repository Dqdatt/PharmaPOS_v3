/* API: lớp duy nhất các màn gọi để đăng nhập / đọc dữ liệu thật. Claude giữ — nhân viên KHÔNG sửa.
   - Live: chạy từ localhost / IP LAN → Supabase local cùng máy (http://<host>:54321).
   - Mock: chỗ khác (GitHub Pages...) → dữ liệu giả, mã OTP đúng là 123456.
   Mọi hàm trả Promise<{ ok: true, ...data } | { ok: false, error: 'câu tiếng Việt' }>, không throw. */
(function () {
  const host = location.hostname;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/.test(host);
  // Test iPhone qua HTTPS tunnel (pwa/tools/serve.mjs chuyển tiếp Supabase cùng origin)
  const tunnel = /\.trycloudflare\.com$/.test(host);
  const live = !!window.supabase && ((isLocal && location.protocol === 'http:') || tunnel);
  // shortcut: URL + anon key cố định cho Supabase LOCAL (key demo công khai của CLI), khi lên thật đọc từ cấu hình build
  const sb = live ? window.supabase.createClient(tunnel ? location.origin : `http://${host}:54321`,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
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

  async function readProfile() {
    const { data, error } = await sb.rpc('my_profile');
    if (error) throw error;
    return data && data[0] ? data[0] : null;
  }
  // Sau khi có phiên: kiểm trạng thái, khoá thì đăng xuất luôn
  async function afterAuth() {
    const profile = await readProfile();
    if (!profile) { await sb.auth.signOut(); return fail('Email này chưa được cấp tài khoản'); }
    if (profile.status === 'locked') { await sb.auth.signOut(); return fail('Tài khoản đã bị khoá, vui lòng liên hệ admin'); }
    const pk = pkLocal();
    if (pk && pk.uid !== profile.id) localStorage.removeItem(PK_KEY); // passkey của tài khoản khác: không mở khoá nhầm người
    return { ok: true, profile };
  }

  // ---------- Passkey WebAuthn (Face ID thật), xác minh ở Edge Function `passkey` ----------
  const PK_KEY = 'medipos.passkey'; // { id: credential id, uid: users.id } passkey của máy này (live); mock dùng cờ medipos.bio
  const pkLocal = () => { try { const v = JSON.parse(localStorage.getItem(PK_KEY)); return v && v.id ? v : null; } catch (e) { return null; } };
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
  async function pkFn(body) {
    const { data, error } = await sb.functions.invoke('passkey', { body });
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

  const MOCK_PROFILE = () => ({ id: 0, name: DATA.owner.name, role: 'manager', status: 'active', email: 'demo@medipos.vn', phone: '84903128466' });
  let mockStatus = 'invited';

  const API = (window.API = {
    live,
    MIN_PASS,

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
        if (r.ok && r.profile.status === 'invited') { await sb.auth.signOut(); return fail('Tài khoản chưa kích hoạt, chọn "Quên mật khẩu" để nhận mã'); }
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
        if (!p || p.status === 'locked') { await sb.auth.signOut(); return null; }
        return p;
      } catch (e) { return null; }
    },

    async signOut() {
      await API.bio.disable();
      localStorage.removeItem(PK_KEY); // xoá ở server lỗi (mất mạng) thì máy này vẫn phải quên passkey
      if (live) { try { await sb.auth.signOut(); } catch (e) { /* vẫn xoá phiên cục bộ */ } }
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
          const ua = r.user_agent || '';
          const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
            : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt';
          const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) && !/Mobile/.test(ua) ? 'macOS'
            : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Máy tính';
          const t = new Date(r.created_at);
          return { ok: true, request: { browser, os, ip: r.ip || '', time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`, expiresAt: new Date(r.expires_at).getTime() } };
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
        } catch (e) { return pkFail(e); }
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
          localStorage.setItem(PK_KEY, JSON.stringify({ id: r.credential, uid: r.user_id }));
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
          if (e && e.code === 'unknown') localStorage.removeItem(PK_KEY);
          return pkFail(e);
        }
      },
      /** Tắt Face ID máy này: xoá passkey ở server (passkey trong Keychain còn nhưng hết hiệu lực). */
      async disable() {
        localStorage.removeItem('medipos.bio');
        const pk = live && pkLocal();
        if (!pk) return { ok: true };
        try {
          await pkFn({ action: 'delete', credential: pk.id });
          localStorage.removeItem(PK_KEY);
          return { ok: true };
        } catch (e) {
          if (e && e.vi) localStorage.removeItem(PK_KEY); // phiên hết hạn: server không xoá được, máy này vẫn tắt
          return e && e.vi ? { ok: true } : pkFail(e);
        }
      },
    },
  });
})();
