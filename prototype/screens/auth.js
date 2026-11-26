/* Đăng nhập app (email + OTP 6 số + mật khẩu), bật Face ID, khóa app. */
(function () {
  App.icons.eye = '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
  App.icons.eyeOff = '<path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a17.5 17.5 0 0 1-3.2 4.3M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a10.4 10.4 0 0 0 5.4-1.5"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/><path d="m3 3 18 18"/>';
  App.icons.backspace = '<path d="M21 5H9l-7 7 7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z"/><path d="m17 9-6 6M11 9l6 6"/>';

  App.css(`
  .au-wrap { min-height: 100%; display: flex; flex-direction: column; padding: calc(var(--sat) + 28px) 20px calc(var(--sab) + 16px); }
  .au-wrap.has-nav { padding-top: 8px; min-height: calc(100% - var(--sat) - 56px); }
  .au-h1 { font-size: 28px; font-weight: 700; line-height: 1.25; margin-top: 24px; color: var(--ink); }
  .au-sub { font-size: 15px; line-height: 1.5; color: var(--ink-2); margin-top: 8px; }
  .au-form { margin-top: 20px; display: flex; flex-direction: column; gap: 6px; }
  .au-field label { display: block; font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .au-input-wrap { position: relative; display: flex; align-items: center; }
  .au-input { width: 100%; height: 52px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--card);
    padding: 0 16px; font: inherit; font-size: 16px; color: var(--ink); outline: none; transition: border-color .2s var(--ease), box-shadow .2s var(--ease); }
  .au-input.has-btn { padding-right: 48px; }
  .au-input:focus { border: 2px solid var(--teal-600); padding-left: 15.5px; }
  .au-input.err { border: 1.5px solid var(--bad); }
  .au-input.err:focus { border: 2px solid var(--bad); }
  .au-input-wrap.shake { animation: shake .45s var(--ease); }
  .au-eye { position: absolute; right: 6px; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: var(--ink-3); }
  .au-err { display: flex; align-items: flex-start; gap: 6px; margin-top: 6px; min-height: 38px; font-size: 13px; line-height: 1.4; color: var(--bad); }
  .au-err .ic { margin-top: 1px; flex: none; }
  .au-err[hidden] { display: flex; visibility: hidden; }
  .au-hint { font-size: 13px; line-height: 1.4; color: var(--ink-2); margin-top: 6px; }
  .au-login { min-height: 100%; display: flex; flex-direction: column; }
  .au-hero { position: relative; background: var(--brand-grad); color: var(--on-dark); padding: calc(var(--sat) + 28px) 24px 44px;
    -webkit-mask: radial-gradient(circle 7px at 50% 100%, transparent 96%, black 100%) 0 0 / 20px 100% repeat-x;
            mask: radial-gradient(circle 7px at 50% 100%, transparent 96%, black 100%) 0 0 / 20px 100% repeat-x; }
  .au-hero-mark { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; }
  .au-hero-mark svg { width: 48px; height: 48px; color: var(--on-dark); }
  .au-hero-word { font-size: 28px; font-weight: 600; margin-top: 20px; }
  .au-hero-word b { font-weight: 800; }
  .au-hero-sub { font-size: 15px; line-height: 1.5; color: var(--on-dark-2); margin-top: 6px; max-width: 290px; }
  .au-login .au-wrap { min-height: 0; flex: 1; padding-top: 20px; }
  .au-login .au-h1 { margin-top: 0; font-size: 22px; }
  .au-links { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .au-link { font-size: 14px; font-weight: 600; color: var(--teal-700); padding: 4px 0; display: inline-flex; align-items: center; gap: 6px; }
  .au-link:disabled { opacity: .55; pointer-events: none; }
  .au-foot { margin-top: auto; padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }

  /* OTP */
  .au-otp-zone { position: relative; margin-top: 28px; }
  .au-otp-input { position: absolute; inset: 0; opacity: 0; pointer-events: none; font-size: 16px; }
  .au-otp-row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  .au-otp-row.shake { animation: shake .45s var(--ease); }
  .au-otp-box { height: 56px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--card);
    display: grid; place-items: center; font-size: 24px; font-weight: 700; color: var(--ink);
    transition: border-color .2s var(--ease), background .2s var(--ease), color .2s var(--ease); }
  .au-otp-box.active { border: 2px solid var(--teal-600); }
  .au-otp-box.ok { border-color: var(--ok); background: var(--ok-soft); color: var(--ok); }
  .au-otp-box.err { border-color: var(--bad); }
  .au-caret { width: 2px; height: 24px; border-radius: 1px; background: var(--teal-600); animation: auBlink 1s steps(1) infinite; }
  @keyframes auBlink { 50% { opacity: 0; } }
  .au-resend { margin-top: 8px; font-size: 14px; color: var(--ink-2); min-height: 24px; display: flex; align-items: center; gap: 8px; }
  .au-resend button { font-size: 14px; font-weight: 600; color: var(--teal-700); display: inline-flex; align-items: center; gap: 6px; }
  .au-checking { font-size: 14px; color: var(--teal-700); font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }

  .au-kb { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 6px var(--sab); z-index: 5;
    background: color-mix(in srgb, var(--soft) 72%, var(--ink-3)); animation: auKbIn .38s var(--ease) both; transition: opacity .2s var(--ease); }
  .au-kb.locked { pointer-events: none; opacity: .55; }
  @keyframes auKbIn { from { transform: translateY(100%); } }
  .au-kb-suggest { width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; gap: 2px; flex-direction: column; font-size: 13px; color: var(--ink-2); }
  .au-kb-suggest b { font-size: 16px; font-weight: 600; color: var(--ink); letter-spacing: .04em; }
  .au-kb-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding-bottom: 6px; }
  .au-kb-keys button { height: 46px; border-radius: 6px; background: var(--card); box-shadow: 0 1px 0 color-mix(in srgb, var(--ink) 35%, transparent);
    display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ink); }
  .au-kb-keys button:active { background: var(--soft); }
  .au-kb-keys b { font-size: 24px; font-weight: 400; line-height: 1; }
  .au-kb-keys span { font-size: 12px; font-weight: 600; letter-spacing: .1em; color: var(--ink-2); }
  .au-kb-keys .blank, .au-kb-keys .del { background: none; box-shadow: none; }

  /* Face ID setup */
  .au-bio-mid { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 12px; }
  .au-bio-tile { width: 112px; height: 112px; border-radius: 32px; background: var(--teal-50); color: var(--teal-700);
    display: grid; place-items: center; animation: auBreath 2.4s var(--ease) infinite alternate; }
  @keyframes auBreath { from { transform: scale(1); } to { transform: scale(.96); } }
  .au-bio-title { font-size: 24px; font-weight: 700; line-height: 1.3; margin-top: 28px; color: var(--ink); }
  .au-bio-sub { font-size: 15px; line-height: 1.5; color: var(--ink-2); margin-top: 10px; max-width: 300px; }
  .au-bio-err { min-height: 38px; margin-top: 14px; font-size: 14px; line-height: 1.4; color: var(--bad); }

  /* Lock screen */
  .au-lock { min-height: 100%; background: var(--brand-grad); color: var(--on-dark);
    display: flex; flex-direction: column; padding: calc(var(--sat) + 34px) 20px calc(var(--sab) + 12px); }
  .au-lock-head { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .au-lock-logo { width: 64px; height: 64px; color: var(--on-dark); }
  .au-lock-hi { font-size: 22px; font-weight: 700; margin-top: 16px; color: var(--on-dark); }
  .au-lock-store { font-size: 15px; color: var(--on-dark-2); margin-top: 4px; }
  .au-lock-pass { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 10px; opacity: 0; pointer-events: none; transition: opacity .28s var(--ease); }
  .au-lock-pass.show { opacity: 1; pointer-events: auto; }
  .au-lock-pass .au-input { background: var(--glass-clear); border-color: var(--on-dark-2); color: var(--on-dark); }
  .au-lock-pass .au-input::placeholder { color: var(--on-dark-2); }
  .au-lock-pass .au-input:focus { border-color: var(--on-dark); }
  .au-lock-pass .au-input.err { border-color: var(--mint); }
  .au-lock-pass .au-eye { color: var(--on-dark-2); }
  .au-lock-pass .au-err { color: var(--mint); }
  .au-lock-acts { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; gap: 8px; }
  .au-lock-acts button { font-size: 14px; font-weight: 600; color: var(--on-dark-2); padding: 10px 6px; display: inline-flex; align-items: center; gap: 6px; }
  .au-lock-acts button:active { color: var(--on-dark); }
  .au-lock-acts button:disabled { opacity: .5; pointer-events: none; }
  .au-lock-acts button[hidden] { display: none; }
  `);

  const SAMPLE_EMAIL = 'khoa@nhathuoc.vn';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isActiveView = (el) => el.isConnected && (!App.current() || App.current().el === el);

  function maskEmail(email) {
    const s = String(email || '').trim();
    const at = s.indexOf('@');
    if (at <= 0) return 'k***@nhathuoc.vn';
    return `${s[0]}***${s.slice(at)}`;
  }

  function triggerShake(node) {
    if (!node) return;
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  }

  function bindEyeToggle(inp, btn) {
    btn.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.innerHTML = App.icon(show ? 'eyeOff' : 'eye', 20);
      btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    });
  }

  // ---------- 1. Đăng nhập ----------
  App.screen('login', {
    statusLight: true,
    render: (p) => {
      const email = p.email || '';
      const emailErr = p.emailError || '';
      const passErr = p.passError || '';
      return `<div class="au-login"><div class="au-hero">
        <div class="au-hero-mark glass-clear rise">${App.logoMark()}</div>
        <div class="au-hero-word">Medi<b>POS</b></div>
        <p class="au-hero-sub">Duyệt đăng nhập web và xem doanh thu nhà thuốc ngay trên điện thoại.</p>
      </div>
      <div class="au-wrap">
        <h1 class="au-h1">Đăng nhập</h1>
        <p class="au-sub">Dùng email được quản trị cấp cho bạn.</p>
        <form class="au-form" novalidate>
          <div class="au-field">
            <label for="auEmail">Email</label>
            <div class="au-input-wrap${emailErr ? ' shake' : ''}" data-wrap="email">
              <input id="auEmail" class="au-input${emailErr ? ' err' : ''}" type="email" inputmode="email"
                autocomplete="username" placeholder="ten@nhathuoc.vn" value="${App.esc(email)}">
            </div>
            <div class="au-err" data-err="email" ${emailErr ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(emailErr)}</span></div>
          </div>
          <div class="au-field">
            <label for="auPass">Mật khẩu</label>
            <div class="au-input-wrap${passErr ? ' shake' : ''}" data-wrap="pass">
              <input id="auPass" class="au-input has-btn${passErr ? ' err' : ''}" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu">
              <button type="button" class="au-eye" data-toggle-pass aria-label="Hiện mật khẩu">${App.icon('eye', 20)}</button>
            </div>
            <div class="au-err" data-err="pass" ${passErr ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(passErr)}</span></div>
          </div>
          <div class="au-links">
            <button type="button" class="au-link" data-send-code>Đăng nhập lần đầu</button>
            <button type="button" class="au-link" data-send-code>Quên mật khẩu?</button>
          </div>
        </form>
        <div class="au-foot">
          <button type="button" class="btn btn-primary block" data-submit>Đăng nhập</button>
        </div>
      </div></div>`;
    },
    mount: (el) => {
      const emailIn = el.querySelector('#auEmail');
      const passIn = el.querySelector('#auPass');
      const eyeBtn = el.querySelector('[data-toggle-pass]');
      const submitBtn = el.querySelector('[data-submit]');
      const sendBtns = [...el.querySelectorAll('[data-send-code]')];
      let busy = false;

      const startBusy = (activeBtn, text) => {
        busy = true;
        [submitBtn, ...sendBtns].forEach((b) => { if (b !== activeBtn) b.disabled = true; });
        const restore = App.busy(activeBtn, text);
        return () => {
          busy = false;
          restore();
          [submitBtn, ...sendBtns].forEach((b) => { b.disabled = false; });
        };
      };

      const setErr = (field, msg) => {
        const inp = field === 'email' ? emailIn : passIn;
        const wrap = el.querySelector(`[data-wrap="${field}"]`);
        const box = el.querySelector(`[data-err="${field}"]`);
        if (msg) {
          inp.classList.add('err');
          box.querySelector('span').textContent = msg;
          box.hidden = false;
          triggerShake(wrap);
        } else {
          inp.classList.remove('err');
          box.hidden = true;
        }
      };

      emailIn.addEventListener('input', () => setErr('email', ''));
      passIn.addEventListener('input', () => setErr('pass', ''));
      bindEyeToggle(passIn, eyeBtn);

      sendBtns.forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (busy) return;
          const email = emailIn.value.trim().toLowerCase();
          if (!EMAIL_RE.test(email)) {
            setErr('email', 'Email không hợp lệ');
            emailIn.focus();
            return;
          }
          const done = startBusy(btn, 'Đang gửi mã...');
          const r = await API.sendCode(email);
          if (!isActiveView(el)) return;
          done();
          if (r.ok) {
            App.go('otp', { email: r.email || email });
          } else {
            setErr('email', r.error);
            emailIn.focus();
          }
        });
      });

      const submit = async () => {
        if (busy) return;
        const done = startBusy(submitBtn, 'Đang đăng nhập...');
        const r = await API.signIn(emailIn.value, passIn.value);
        if (!isActiveView(el)) return;
        done();
        if (r.ok) {
          API.bio.enabled() ? App.reset('home', {}, 'fade') : App.go('bioSetup');
          return;
        }
        if (/email không hợp lệ|chưa được cấp tài khoản|chưa kích hoạt/i.test(r.error)) {
          setErr('email', r.error);
          emailIn.focus();
        } else {
          setErr('pass', r.error);
          passIn.focus();
        }
      };

      submitBtn.addEventListener('click', submit);
      el.querySelector('.au-form').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
      [emailIn, passIn].forEach((inp) => inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      }));
    },
  });

  // ---------- 2. OTP ----------
  App.screen('otp', {
    render: (p) => {
      const masked = maskEmail(p.email || SAMPLE_EMAIL);
      const errMsg = p.error || '';
      const showSuggest = !(window.API && API.live) || p.qa;
      return `${App.header({ title: '' })}
        <div class="au-wrap has-nav">
          <h1 class="page-title" style="padding:4px 0 0">Nhập mã xác thực</h1>
          <p class="au-sub">Đã gửi mã đến <span class="num">${App.esc(masked)}</span></p>
          <div class="au-otp-zone">
            <input class="au-otp-input" type="tel" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="Mã xác thực 6 số">
            <div class="au-otp-row${errMsg ? ' shake' : ''}">
              ${Array.from({ length: 6 }, (_, i) => `<div class="au-otp-box num${i === 0 ? ' active' : ''}${errMsg ? ' err' : ''}">${i === 0 ? '<span class="au-caret"></span>' : ''}</div>`).join('')}
            </div>
            <div class="au-err" ${errMsg ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(errMsg)}</span></div>
          </div>
          <div class="au-resend">Gửi lại mã sau <span class="num" data-cd>1:00</span></div>
        </div>
        <div class="au-kb" aria-hidden="true">
          ${showSuggest ? '<button type="button" class="au-kb-suggest" data-fill="123456">Từ Email<b class="num">123456</b></button>' : ''}
          <div class="au-kb-keys">${['1|', '2|ABC', '3|DEF', '4|GHI', '5|JKL', '6|MNO', '7|PQRS', '8|TUV', '9|WXYZ'].map((k) => {
            const [d, l] = k.split('|'); return `<button type="button" data-k="${d}"><b>${d}</b><span>${l}</span></button>`; }).join('')}
            <span class="blank"></span><button type="button" data-k="0"><b>0</b></button>
            <button type="button" class="del" data-k="del" aria-label="Xóa">${App.icon('backspace', 24)}</button></div>
        </div>`;
    },
    mount: (el, p) => {
      const email = p.email || SAMPLE_EMAIL;
      const inp = el.querySelector('.au-otp-input');
      const row = el.querySelector('.au-otp-row');
      const boxes = [...el.querySelectorAll('.au-otp-box')];
      const errBox = el.querySelector('.au-err');
      const resendEl = el.querySelector('.au-resend');
      const kbEl = el.querySelector('.au-kb');
      const backBtn = el.querySelector('[data-back]');
      let busy = false;
      let sec = 60;

      const setBusy = (on) => {
        busy = on;
        inp.disabled = on;
        kbEl.classList.toggle('locked', on);
        if (backBtn) {
          backBtn.disabled = on;
          backBtn.style.pointerEvents = on ? 'none' : '';
        }
      };

      const drawBoxes = (val, isErr = false) => {
        boxes.forEach((b, i) => {
          const ch = val[i];
          b.classList.remove('active', 'ok', 'err');
          if (isErr) b.classList.add('err');
          if (ch) b.textContent = ch;
          else if (i === val.length && !busy) {
            b.classList.add('active');
            b.innerHTML = '<span class="au-caret"></span>';
          } else b.textContent = '';
        });
      };

      const fmtSec = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
      const renderResend = () => {
        if (busy) return;
        if (sec > 0) {
          resendEl.innerHTML = `Gửi lại mã sau <span class="num">${fmtSec(sec)}</span>`;
        } else {
          resendEl.innerHTML = '<button type="button" data-resend>Gửi lại mã</button>';
          resendEl.querySelector('[data-resend]').addEventListener('click', async (e) => {
            if (busy) return;
            setBusy(true);
            const done = App.busy(e.currentTarget, 'Đang gửi...');
            const r = await API.sendCode(email);
            if (!isActiveView(el)) return;
            setBusy(false);
            if (r.ok) {
              inp.value = '';
              errBox.hidden = true;
              App.toast('Đã gửi mã mới');
              sec = 60;
              renderResend();
              drawBoxes('');
              focusInput();
            } else {
              done();
              App.toast(r.error, 'alert');
            }
          });
        }
      };

      const focusInput = () => { if (!busy) inp.focus({ preventScroll: true }); };
      kbEl.addEventListener('click', (e) => {
        const b = e.target.closest('[data-k],[data-fill]');
        if (!b || busy) return;
        const k = b.dataset.k;
        inp.value = b.dataset.fill || (k === 'del' ? inp.value.slice(0, -1) : (inp.value + k).slice(0, 6));
        inp.dispatchEvent(new Event('input'));
      });
      row.addEventListener('click', focusInput);
      setTimeout(focusInput, 120);

      inp.addEventListener('input', async () => {
        if (busy) return;
        const val = inp.value.replace(/\D/g, '').slice(0, 6);
        inp.value = val;
        errBox.hidden = true;
        drawBoxes(val);

        if (val.length === 6) {
          setBusy(true);
          resendEl.innerHTML = '<span class="au-checking"><span class="spin"></span>Đang kiểm tra mã...</span>';
          const r = await API.verifyCode(email, val);
          if (!isActiveView(el)) return;
          if (r.ok) {
            boxes.forEach((b, i) => setTimeout(() => { if (el.isConnected) b.classList.add('ok'); }, i * 40));
            setTimeout(() => {
              if (isActiveView(el)) App.go('password', { status: r.profile && r.profile.status });
            }, 350);
          } else {
            errBox.querySelector('span').textContent = r.error;
            errBox.hidden = false;
            triggerShake(row);
            drawBoxes('', true);
            inp.value = '';
            setTimeout(() => {
              if (!isActiveView(el)) return;
              setBusy(false);
              renderResend();
              drawBoxes('');
              focusInput();
            }, 380);
          }
        }
      });

      const timer = setInterval(() => {
        if (!el.isConnected) { clearInterval(timer); return; }
        if (sec > 0) { sec--; if (!busy) renderResend(); }
      }, 1000);
    },
  });

  // ---------- 3. Tạo / Đổi mật khẩu ----------
  App.screen('password', {
    render: (p) => {
      const isChange = p.mode === 'change';
      const isInvited = p.status === 'invited';
      const title = isInvited ? 'Tạo mật khẩu' : 'Đặt mật khẩu mới';
      const sub = isInvited
        ? 'Tạo mật khẩu để đăng nhập nhanh cho những lần sau.'
        : 'Đặt mật khẩu mới cho tài khoản của bạn.';
      const head = isChange ? App.header({ title: '', back: true }) : '';
      const mismatchErr = p.mismatch ? 'Hai lần nhập không khớp. Kiểm tra lại.' : '';
      const minPass = (window.API && API.MIN_PASS) || 8;
      return `${head}<div class="au-wrap${isChange ? ' has-nav' : ''}">
        <h1 class="au-h1">${App.esc(title)}</h1>
        <p class="au-sub">${App.esc(sub)}</p>
        <form class="au-form" novalidate>
          <div class="au-field">
            <label for="auPass1">Mật khẩu</label>
            <div class="au-input-wrap" data-wrap="pass1">
              <input id="auPass1" class="au-input has-btn" type="password" autocomplete="new-password" placeholder="Nhập mật khẩu">
              <button type="button" class="au-eye" data-toggle="pass1" aria-label="Hiện mật khẩu">${App.icon('eye', 20)}</button>
            </div>
            <p class="au-hint">Ít nhất ${minPass} ký tự</p>
            <div class="au-err" data-err="pass1" hidden>${App.icon('alert', 16)}<span></span></div>
          </div>
          <div class="au-field">
            <label for="auPass2">Nhập lại mật khẩu</label>
            <div class="au-input-wrap${mismatchErr ? ' shake' : ''}" data-wrap="pass2">
              <input id="auPass2" class="au-input has-btn${mismatchErr ? ' err' : ''}" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu">
              <button type="button" class="au-eye" data-toggle="pass2" aria-label="Hiện mật khẩu">${App.icon('eye', 20)}</button>
            </div>
            <div class="au-err" data-err="pass2" ${mismatchErr ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(mismatchErr)}</span></div>
          </div>
        </form>
        <div class="au-foot">
          <button type="button" class="btn btn-primary block" data-submit>Lưu mật khẩu</button>
        </div>
      </div>`;
    },
    mount: (el, p) => {
      const isChange = p.mode === 'change';
      const pass1In = el.querySelector('#auPass1');
      const pass2In = el.querySelector('#auPass2');
      const submitBtn = el.querySelector('[data-submit]');

      const setErr = (field, msg) => {
        const inp = field === 'pass1' ? pass1In : pass2In;
        const wrap = el.querySelector(`[data-wrap="${field}"]`);
        const box = el.querySelector(`[data-err="${field}"]`);
        if (msg) {
          inp.classList.add('err');
          box.querySelector('span').textContent = msg;
          box.hidden = false;
          triggerShake(wrap);
        } else {
          inp.classList.remove('err');
          box.hidden = true;
        }
      };

      pass1In.addEventListener('input', () => setErr('pass1', ''));
      pass2In.addEventListener('input', () => setErr('pass2', ''));
      bindEyeToggle(pass1In, el.querySelector('[data-toggle="pass1"]'));
      bindEyeToggle(pass2In, el.querySelector('[data-toggle="pass2"]'));

      const submit = async () => {
        if (submitBtn.disabled) return;
        const p1 = pass1In.value;
        const p2 = pass2In.value;
        if (p1 !== p2) {
          setErr('pass2', 'Hai lần nhập không khớp. Kiểm tra lại.');
          pass2In.focus();
          return;
        }
        if (p1.length < API.MIN_PASS) {
          setErr('pass1', `Mật khẩu cần ít nhất ${API.MIN_PASS} ký tự`);
          pass1In.focus();
          return;
        }
        const done = App.busy(submitBtn, 'Đang lưu...');
        const r = await API.setPassword(p1);
        if (!isActiveView(el)) return;
        done();
        if (r.ok) {
          if (isChange) {
            App.toast('Đã đổi mật khẩu');
            App.back();
          } else {
            API.bio.enabled() ? App.reset('home', {}, 'fade') : App.go('bioSetup');
          }
        } else {
          setErr('pass1', r.error);
          pass1In.focus();
        }
      };

      submitBtn.addEventListener('click', submit);
      el.querySelector('.au-form').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
      [pass1In, pass2In].forEach((inp) => inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      }));
    },
  });

  // ---------- 4. Bật Face ID ----------
  App.screen('bioSetup', {
    render: () => `<div class="au-wrap">
      <div class="au-bio-mid">
        <div class="au-bio-tile">${App.icon('faceid', 56)}</div>
        <h1 class="au-bio-title">Mở app bằng Face ID</h1>
        <p class="au-bio-sub">Dùng Face ID để mở app và duyệt đăng nhập web. Tắt được trong Tài khoản.</p>
        <div class="au-bio-err" aria-live="polite"></div>
      </div>
      <div class="au-foot">
        <button type="button" class="btn btn-primary block" data-enable>Bật Face ID</button>
        <button type="button" class="btn btn-ghost block" data-skip>Để sau</button>
      </div>
    </div>`,
    mount: (el) => {
      const errEl = el.querySelector('.au-bio-err');
      const enableBtn = el.querySelector('[data-enable]');
      const skipBtn = el.querySelector('[data-skip]');

      enableBtn.addEventListener('click', async () => {
        if (enableBtn.disabled) return;
        const done = App.busy(enableBtn, 'Đang bật...');
        skipBtn.disabled = true;
        errEl.textContent = '';
        const ok = await App.faceId();
        if (!isActiveView(el)) return;
        done();
        skipBtn.disabled = false;
        if (ok) {
          API.bio.set(true);
          App.toast('Đã bật Face ID');
          App.reset('home', {}, 'fade');
        } else {
          errEl.textContent = 'Face ID không khớp. Thử lại hoặc để sau.';
        }
      });

      skipBtn.addEventListener('click', () => {
        if (!enableBtn.disabled) App.reset('home', {}, 'fade');
      });
    },
  });

  // ---------- 5. Khóa app ----------
  App.screen('lock', {
    statusLight: true,
    cls: 'dark',
    render: (p) => {
      const firstName = DATA.owner.name.trim().split(/\s+/).pop();
      return `<div class="au-lock">
        <div class="au-lock-head">
          <div class="au-lock-logo">${App.logoMark()}</div>
          <h1 class="au-lock-hi">Chào ${App.esc(firstName)}</h1>
          <p class="au-lock-store">${App.esc(DATA.store.name)}</p>
        </div>
        <form class="au-lock-pass${p.showPass ? ' show' : ''}"${p.showPass ? '' : ' inert'} novalidate>
          <div class="au-field">
            <div class="au-input-wrap" data-wrap="lockPass">
              <input id="auLockPass" class="au-input has-btn" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu để mở khóa">
              <button type="button" class="au-eye" data-toggle-pass aria-label="Hiện mật khẩu">${App.icon('eye', 20)}</button>
            </div>
            <div class="au-err" data-err="lockPass" hidden>${App.icon('alert', 16)}<span></span></div>
          </div>
          <button type="button" class="btn btn-primary block" data-unlock>Mở khóa</button>
        </form>
        <div class="au-lock-acts">
          <button type="button" data-faceid>Dùng Face ID</button>
          <button type="button" data-use-pass${p.showPass ? ' hidden' : ''}>Dùng mật khẩu</button>
          <button type="button" data-logout>Đăng xuất</button>
        </div>
      </div>`;
    },
    mount: (el, p) => {
      const hiEl = el.querySelector('.au-lock-hi');
      const passArea = el.querySelector('.au-lock-pass');
      const passIn = el.querySelector('#auLockPass');
      const passWrap = el.querySelector('[data-wrap="lockPass"]');
      const errBox = el.querySelector('[data-err="lockPass"]');
      const unlockBtn = el.querySelector('[data-unlock]');
      const usePassBtn = el.querySelector('[data-use-pass]');
      const faceIdBtn = el.querySelector('[data-faceid]');
      const logoutBtn = el.querySelector('[data-logout]');

      const allowSample = p.qa || !(window.API && API.live);
      let userEmail = p.email || (allowSample ? SAMPLE_EMAIL : '');
      let busy = false;

      if (!p.qa) {
        API.profile().then((prof) => {
          if (!el.isConnected || !prof) return;
          if (prof.email) userEmail = prof.email;
          if (prof.name) {
            const first = prof.name.trim().split(/\s+/).pop();
            if (first) hiEl.textContent = `Chào ${first}`;
          }
        });
      }

      const showPassForm = () => {
        passArea.inert = false;
        passArea.removeAttribute('inert');
        passArea.classList.add('show');
        usePassBtn.hidden = true;
        setTimeout(() => { if (el.isConnected && !busy) passIn.focus(); }, 120);
      };

      const setErr = (msg) => {
        if (msg) {
          passIn.classList.add('err');
          errBox.querySelector('span').textContent = msg;
          errBox.hidden = false;
          triggerShake(passWrap);
        } else {
          passIn.classList.remove('err');
          errBox.hidden = true;
        }
      };

      const startBusy = (activeBtn, text) => {
        busy = true;
        passIn.disabled = true;
        [unlockBtn, usePassBtn, faceIdBtn, logoutBtn].forEach((b) => { if (b !== activeBtn) b.disabled = true; });
        const restore = App.busy(activeBtn, text);
        return () => {
          busy = false;
          passIn.disabled = false;
          restore();
          [unlockBtn, usePassBtn, faceIdBtn, logoutBtn].forEach((b) => { b.disabled = false; });
        };
      };

      passIn.addEventListener('input', () => setErr(''));
      bindEyeToggle(passIn, el.querySelector('[data-toggle-pass]'));

      const runFaceId = async () => {
        if (busy) return;
        const done = startBusy(faceIdBtn, 'Đang mở khóa...');
        const ok = await App.faceId();
        if (!isActiveView(el)) return;
        if (!ok) {
          done();
          showPassForm();
          return;
        }
        if (window.API && API.live) {
          const me = await API.profile();
          if (!isActiveView(el)) return;
          done();
          if (!me) {
            App.toast('Phiên đăng nhập đã hết, vui lòng đăng nhập lại', 'alert');
            App.reset('login');
            return;
          }
        } else {
          done();
        }
        App.reset('home', {}, 'fade');
      };

      if (!p.showPass && !p.qa) {
        setTimeout(() => {
          if (isActiveView(el)) runFaceId();
        }, 400);
      }

      const unlock = async () => {
        if (busy) return;
        const done = startBusy(unlockBtn, 'Đang mở khóa...');
        if (!userEmail) {
          const prof = await API.profile();
          if (!isActiveView(el)) return;
          if (prof && prof.email) {
            userEmail = prof.email;
          } else if (allowSample) {
            userEmail = SAMPLE_EMAIL;
          } else {
            done();
            setErr('Không đọc được thông tin tài khoản. Thử lại hoặc đăng xuất.');
            return;
          }
        }
        const r = await API.signIn(userEmail, passIn.value);
        if (!isActiveView(el)) return;
        done();
        if (r.ok) {
          App.reset('home', {}, 'fade');
        } else {
          setErr(r.error);
          passIn.focus();
        }
      };

      unlockBtn.addEventListener('click', unlock);
      passArea.addEventListener('submit', (e) => { e.preventDefault(); unlock(); });
      passIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); unlock(); }
      });

      usePassBtn.addEventListener('click', showPassForm);
      faceIdBtn.addEventListener('click', runFaceId);
      logoutBtn.addEventListener('click', async () => {
        if (busy) return;
        const done = startBusy(logoutBtn, 'Đang đăng xuất...');
        await API.signOut();
        if (!isActiveView(el)) return;
        done();
        App.reset('login');
      });
    },
  });

  // ---------- Trạng thái QA ----------
  App.state('Đăng nhập', () => App.reset('login'), 'Đăng nhập');
  App.state('Đăng nhập: lỗi email', () => App.reset('login', { email: 'ten@', emailError: 'Email không hợp lệ' }), 'Đăng nhập');
  App.state('Đăng nhập: sai mật khẩu', () => App.reset('login', { email: SAMPLE_EMAIL, passError: 'Email hoặc mật khẩu không đúng' }), 'Đăng nhập');
  App.state('Nhập mã', () => App.reset('otp', { email: SAMPLE_EMAIL, qa: true }), 'Đăng nhập');
  App.state('Mã sai', () => App.reset('otp', { email: SAMPLE_EMAIL, error: 'Mã không đúng hoặc đã hết hạn', qa: true }), 'Đăng nhập');
  App.state('Tạo mật khẩu (lần đầu)', () => App.reset('password', { status: 'invited' }), 'Đăng nhập');
  App.state('Đặt mật khẩu mới', () => App.reset('password', { status: 'active' }), 'Đăng nhập');
  App.state('Mật khẩu không khớp', () => App.reset('password', { status: 'invited', mismatch: true }), 'Đăng nhập');
  App.state('Bật Face ID', () => App.reset('bioSetup'), 'Đăng nhập');
  App.state('Khóa app (Face ID)', () => App.reset('lock', { qa: true }), 'Đăng nhập');
  App.state('Khóa app (mật khẩu)', () => App.reset('lock', { showPass: true, qa: true }), 'Đăng nhập');
})();
