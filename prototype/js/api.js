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
    return { ok: true, profile };
  }

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
      API.bio.set(false);
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
      /** Duyệt (approve=true, gọi SAU App.faceId() thành công) hoặc từ chối. */
      async decide(id, approve) {
        if (!live) { await wait(600); return { ok: true }; }
        try {
          const { data, error } = await sb.rpc('web_login_decide', { req_id: id, approve: !!approve });
          if (error) return fail(error);
          if (data === 'approved' || data === 'rejected') return { ok: true };
          if (data === 'admin_blocked') return fail('Tài khoản quản trị chỉ dùng app, không đăng nhập POS');
          if (data === 'expired') return fail('Mã đã hết hạn, hãy tải lại mã trên máy tính');
          return fail('Tài khoản chưa có quyền đăng nhập POS');
        } catch (e) { return fail(e); }
      },
    },

    // shortcut: Face ID hiện chỉ là cờ trên máy + App.faceId() mô phỏng; bước 3 thay bằng passkey WebAuthn xác minh ở server
    bio: {
      enabled: () => localStorage.getItem('medipos.bio') === '1',
      set: (on) => (on ? localStorage.setItem('medipos.bio', '1') : localStorage.removeItem('medipos.bio')),
    },
  });
})();
