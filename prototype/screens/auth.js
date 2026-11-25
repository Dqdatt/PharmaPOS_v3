/* Đăng nhập app, OTP, bật Face ID, tạo mã PIN, khóa app. */
(function () {
  App.icons.eye = '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
  App.icons.eyeOff = '<path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a17.5 17.5 0 0 1-3.2 4.3M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a10.4 10.4 0 0 0 5.4-1.5"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/><path d="m3 3 18 18"/>';
  App.icons.backspace = '<path d="M21 5H9l-7 7 7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z"/><path d="m17 9-6 6M11 9l6 6"/>';

  App.css(`
  .au-wrap { min-height: 100%; display: flex; flex-direction: column; padding: calc(var(--sat) + 28px) 20px calc(var(--sab) + 16px); }
  .au-wrap.has-nav { padding-top: 8px; }
  .au-logo { width: 72px; height: 72px; border-radius: 18px; display: block; box-shadow: 0 12px 28px -12px rgba(15, 111, 103, .45); }
  .au-h1 { font-size: 28px; font-weight: 700; line-height: 1.25; margin-top: 24px; color: var(--ink); }
  .au-sub { font-size: 15px; line-height: 1.5; color: var(--ink-2); margin-top: 8px; }
  .au-form { margin-top: 28px; display: flex; flex-direction: column; gap: 18px; }
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
  .au-err { display: flex; align-items: flex-start; gap: 6px; margin-top: 8px; font-size: 13px; line-height: 1.4; color: var(--bad); }
  .au-err .ic { margin-top: 1px; }
  .au-forgot { align-self: flex-end; font-size: 14px; font-weight: 600; color: var(--teal-700); padding: 4px 0; }
  .au-foot { margin-top: auto; padding-top: 24px; display: flex; flex-direction: column; gap: 8px; }

  /* OTP */
  .au-otp-zone { position: relative; margin-top: 32px; }
  .au-otp-input { position: absolute; inset: 0; opacity: 0; pointer-events: none; font-size: 16px; }
  .au-otp-row { display: grid; grid-template-columns: repeat(6, 48px); justify-content: space-between; gap: 8px; }
  .au-otp-row.shake { animation: shake .45s var(--ease); }
  .au-otp-box { height: 56px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--card);
    display: grid; place-items: center; font-size: 24px; font-weight: 700; color: var(--ink);
    transition: border-color .2s var(--ease), background .2s var(--ease), color .2s var(--ease); }
  .au-otp-box.active { border: 2px solid var(--teal-600); }
  .au-otp-box.ok { border-color: var(--ok); background: var(--ok-soft); color: var(--ok); }
  .au-otp-box.err { border-color: var(--bad); }
  .au-caret { width: 2px; height: 24px; border-radius: 1px; background: var(--teal-600); animation: auBlink 1s steps(1) infinite; }
  @keyframes auBlink { 50% { opacity: 0; } }
  .au-resend { margin-top: 24px; font-size: 14px; color: var(--ink-2); min-height: 24px; }
  .au-resend button { font-size: 14px; font-weight: 600; color: var(--teal-700); }

  /* Face ID setup */
  .au-bio-mid { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 12px; }
  .au-bio-tile { width: 112px; height: 112px; border-radius: 32px; background: var(--teal-50); color: var(--teal-700);
    display: grid; place-items: center; animation: auBreath 2.4s var(--ease) infinite alternate; }
  @keyframes auBreath { from { transform: scale(1); } to { transform: scale(.96); } }
  .au-bio-title { font-size: 24px; font-weight: 700; line-height: 1.3; margin-top: 28px; color: var(--ink); }
  .au-bio-sub { font-size: 15px; line-height: 1.5; color: var(--ink-2); margin-top: 10px; max-width: 300px; }
  .au-bio-err { min-height: 22px; margin-top: 14px; font-size: 14px; color: var(--bad); }

  /* PIN setup & keypad */
  .au-pin-top { text-align: center; padding-top: 12px; }
  .au-pin-title { font-size: 24px; font-weight: 700; line-height: 1.3; color: var(--ink); transition: opacity .22s var(--ease); }
  .au-pin-title.fade { opacity: 0; }
  .au-pin-sub { font-size: 15px; line-height: 1.45; color: var(--ink-2); margin-top: 8px; min-height: 22px; }
  .au-dots { display: flex; justify-content: center; gap: 16px; margin-top: 28px; }
  .au-dots.shake { animation: shake .45s var(--ease); }
  .au-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid var(--ink-3); background: transparent;
    transition: background .16s var(--ease), border-color .16s var(--ease), transform .24s var(--pop); }
  .au-dot.on { border-color: var(--teal-700); background: var(--teal-700); transform: scale(1.18); }
  .au-dot.ok { border-color: var(--ok); background: var(--ok); transform: scale(1.18); }
  .au-pin-err { min-height: 40px; margin-top: 16px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; line-height: 1.4; color: var(--bad); text-align: center; padding: 0 12px; }

  .au-pad { display: grid; grid-template-columns: repeat(3, 76px); justify-content: center; gap: 14px 22px; margin-top: auto; padding-bottom: 12px; }
  .au-key { width: 76px; height: 76px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--card); border: 1px solid var(--line); color: var(--ink); transition: background .14s var(--ease), transform .14s var(--ease); user-select: none; }
  .au-key:active, .au-key.lit { background: var(--soft); transform: scale(.95); }
  .au-key b { font-size: 28px; font-weight: 500; line-height: 1.05; }
  .au-key span { font-size: 12px; font-weight: 600; color: var(--ink-3); letter-spacing: .06em; margin-top: 1px; min-height: 14px; }
  .au-key.del { background: transparent; border-color: transparent; color: var(--ink-2); }
  .au-key.del:active, .au-key.del.lit { background: var(--soft); }

  /* PIN done */
  .au-done { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 20px; }
  .au-done-ring { width: 88px; height: 88px; border-radius: 50%; background: var(--ok-soft); color: var(--ok); display: grid; place-items: center; }
  .au-done-ring svg { width: 42px; height: 42px; }
  .au-done-ring path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .55s var(--ease) .1s forwards; }
  .au-done h2 { font-size: 24px; font-weight: 700; margin-top: 24px; color: var(--ink); }
  .au-done p { font-size: 15px; line-height: 1.5; color: var(--ink-2); margin-top: 8px; max-width: 280px; }

  /* Lock screen */
  .au-lock { min-height: 100%; background: var(--brand-grad); color: var(--on-dark);
    display: flex; flex-direction: column; padding: calc(var(--sat) + 34px) 20px calc(var(--sab) + 12px); }
  .au-lock-head { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .au-lock-logo { width: 64px; height: 64px; color: var(--on-dark); }
  .au-lock-hi { font-size: 22px; font-weight: 700; margin-top: 16px; color: var(--on-dark); }
  .au-lock-store { font-size: 15px; color: var(--on-dark-2); margin-top: 4px; }
  .au-lock-pin { flex: 1; display: flex; flex-direction: column; opacity: 0; pointer-events: none; transition: opacity .28s var(--ease); }
  .au-lock-pin.show { opacity: 1; pointer-events: auto; }
  .au-lock .au-dot { border-color: var(--on-dark-2); }
  .au-lock .au-dot.on { border-color: var(--on-dark); background: var(--on-dark); }
  .au-lock .au-dot.ok { border-color: var(--mint); background: var(--mint); }
  .au-lock .au-pin-err { color: var(--mint); }
  .au-lock .au-key { border: 0; color: var(--on-dark); }
  .au-lock .au-key span { color: var(--on-dark-2); }
  .au-lock .au-key.del { background: transparent; box-shadow: none; }
  .au-lock .au-key.del::before { display: none; }
  .au-lock-acts { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; }
  .au-lock-acts button { font-size: 14px; font-weight: 600; color: var(--on-dark-2); padding: 10px 8px; }
  .au-lock-acts button:active { color: var(--on-dark); }
  `);

  const KEY_LETTERS = { 1: '', 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ', 0: '' };
  const SAMPLE_PIN = '246810';

  function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
  }

  function formatPhone(s) {
    const d = digitsOnly(s).slice(0, 10);
    if (d.length <= 4) return d;
    if (d.length <= 7) return d.slice(0, 4) + ' ' + d.slice(4);
    return d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7);
  }

  function maskPhone(s) {
    const d = digitsOnly(s);
    if (d.length >= 10) return `${d.slice(0, 4)} *** ${d.slice(7, 10)}`;
    return '0903 *** 466';
  }

  function isWeakPin(pin) {
    if (/^(\d)\1{5}$/.test(pin)) return true;
    return '0123456789'.includes(pin) || '9876543210'.includes(pin);
  }

  function renderDots(count = 6) {
    return `<div class="au-dots">${Array.from({ length: count }, () => '<span class="au-dot"></span>').join('')}</div>`;
  }

  function renderKeypad(dark = false) {
    const cls = dark ? 'au-key glass-clear' : 'au-key';
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
      `<button type="button" class="${cls}" data-key="${n}"><b class="num">${n}</b><span>${KEY_LETTERS[n]}</span></button>`
    ).join('');
    return `<div class="au-pad">${keys}<span></span>` +
      `<button type="button" class="${cls}" data-key="0"><b class="num">0</b><span></span></button>` +
      `<button type="button" class="au-key del" data-del aria-label="Xóa">${App.icon('backspace', 24)}</button></div>`;
  }

  function bindKeypad(el, onDigit, onDel) {
    const flash = (btn) => { btn.classList.add('lit'); setTimeout(() => btn.classList.remove('lit'), 140); };
    el.querySelector('.au-pad').addEventListener('click', (e) => {
      const k = e.target.closest('[data-key]');
      if (k) { flash(k); onDigit(k.dataset.key); return; }
      const d = e.target.closest('[data-del]');
      if (d) { flash(d); onDel(); }
    });
    const onKeyDown = (e) => {
      if (!el.isConnected) return document.removeEventListener('keydown', onKeyDown);
      if (App.current() && App.current().el !== el) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); onDigit(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); onDel(); }
    };
    document.addEventListener('keydown', onKeyDown);
  }

  function triggerShake(node) {
    if (!node) return;
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  }

  // ---------- 1. Đăng nhập ----------
  App.screen('login', {
    render: (p) => {
      const phone = p.phone ? formatPhone(p.phone) : '';
      const phoneErr = p.phoneError ? 'Số điện thoại cần đủ 10 số. Kiểm tra lại rồi thử.' : '';
      return `<div class="au-wrap">
        <div class="au-logo rise">${App.appIcon()}</div>
        <h1 class="au-h1">Đăng nhập PharmaPOS</h1>
        <p class="au-sub">Dùng tài khoản chủ nhà thuốc, giống trên web.</p>
        <form class="au-form" novalidate>
          <div class="au-field">
            <label for="auPhone">Số điện thoại</label>
            <div class="au-input-wrap${p.phoneError ? ' shake' : ''}" data-wrap="phone">
              <input id="auPhone" class="au-input num${p.phoneError ? ' err' : ''}" type="tel" inputmode="numeric"
                autocomplete="tel" placeholder="0903 128 466" value="${App.esc(phone)}" maxlength="12">
            </div>
            <div class="au-err" data-err="phone" ${phoneErr ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(phoneErr)}</span></div>
          </div>
          <div class="au-field">
            <label for="auPass">Mật khẩu</label>
            <div class="au-input-wrap" data-wrap="pass">
              <input id="auPass" class="au-input has-btn" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu">
              <button type="button" class="au-eye" data-toggle-pass aria-label="Hiện mật khẩu">${App.icon('eye', 20)}</button>
            </div>
            <div class="au-err" data-err="pass" hidden>${App.icon('alert', 16)}<span></span></div>
          </div>
          <button type="button" class="au-forgot" data-forgot>Quên mật khẩu?</button>
        </form>
        <div class="au-foot">
          <button type="button" class="btn btn-primary block" data-submit>Đăng nhập</button>
        </div>
      </div>`;
    },
    mount: (el) => {
      const phoneIn = el.querySelector('#auPhone');
      const passIn = el.querySelector('#auPass');
      const eyeBtn = el.querySelector('[data-toggle-pass]');
      const submitBtn = el.querySelector('[data-submit]');

      const setErr = (field, msg) => {
        const inp = field === 'phone' ? phoneIn : passIn;
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

      phoneIn.addEventListener('input', () => {
        phoneIn.value = formatPhone(phoneIn.value);
        setErr('phone', '');
      });
      passIn.addEventListener('input', () => setErr('pass', ''));

      eyeBtn.addEventListener('click', () => {
        const show = passIn.type === 'password';
        passIn.type = show ? 'text' : 'password';
        eyeBtn.innerHTML = App.icon(show ? 'eyeOff' : 'eye', 20);
        eyeBtn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      });

      el.querySelector('[data-forgot]').addEventListener('click', () => {
        App.sheet(`<h3>Đặt lại mật khẩu</h3>
          <p>Chủ nhà thuốc đặt lại mật khẩu trên web, mục Nhân viên. Cần hỗ trợ thì gọi 1900 6868.</p>
          <div style="margin-top:20px"><button class="btn btn-secondary block" data-close>Đã hiểu</button></div>`);
      });

      const submit = () => {
        const done = App.busy(submitBtn, 'Đang đăng nhập...');
        setTimeout(() => {
          if (!el.isConnected) return;
          done();
          const digits = digitsOnly(phoneIn.value);
          if (digits.length < 10) {
            setErr('phone', 'Số điện thoại cần đủ 10 số. Kiểm tra lại rồi thử.');
            phoneIn.focus();
            return;
          }
          if (!passIn.value.trim()) {
            setErr('pass', 'Nhập mật khẩu để tiếp tục.');
            passIn.focus();
            return;
          }
          App.go('otp', { phone: formatPhone(digits) });
        }, 900);
      };

      submitBtn.addEventListener('click', submit);
      el.querySelector('.au-form').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    },
  });

  // ---------- 2. OTP ----------
  App.screen('otp', {
    render: (p) => {
      const masked = maskPhone(p.phone || DATA.owner.phone);
      const errMsg = p.error ? 'Mã không đúng. Còn 4 lần thử.' : '';
      return `${App.header({ title: '' })}
        <div class="au-wrap has-nav">
          <h1 class="page-title" style="padding:4px 0 0">Nhập mã xác thực</h1>
          <p class="au-sub">Mã 6 số đã gửi tới <span class="num">${App.esc(masked)}</span></p>
          <div class="au-otp-zone">
            <input class="au-otp-input" type="tel" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="Mã xác thực 6 số">
            <div class="au-otp-row${p.error ? ' shake' : ''}">
              ${Array.from({ length: 6 }, (_, i) => `<div class="au-otp-box num${i === 0 ? ' active' : ''}${p.error ? ' err' : ''}">${i === 0 ? '<span class="au-caret"></span>' : ''}</div>`).join('')}
            </div>
            <div class="au-err" ${errMsg ? '' : 'hidden'}>${App.icon('alert', 16)}<span>${App.esc(errMsg)}</span></div>
          </div>
          <div class="au-resend">Gửi lại mã sau <span class="num" data-cd>0:45</span></div>
        </div>`;
    },
    mount: (el, p) => {
      const inp = el.querySelector('.au-otp-input');
      const row = el.querySelector('.au-otp-row');
      const boxes = [...el.querySelectorAll('.au-otp-box')];
      const errBox = el.querySelector('.au-err');
      const resendEl = el.querySelector('.au-resend');
      let triesLeft = p.error ? 4 : 5;
      let locked = false;
      let sec = 45;

      const drawBoxes = (val, isErr = false) => {
        boxes.forEach((b, i) => {
          const ch = val[i];
          b.classList.remove('active', 'ok', 'err');
          if (isErr) b.classList.add('err');
          if (ch) b.textContent = ch;
          else if (i === val.length && !locked) {
            b.classList.add('active');
            b.innerHTML = '<span class="au-caret"></span>';
          } else b.textContent = '';
        });
      };

      const focusInput = () => { if (!locked) inp.focus({ preventScroll: true }); };
      row.addEventListener('click', focusInput);
      setTimeout(focusInput, 120);

      inp.addEventListener('input', () => {
        if (locked) return;
        const val = digitsOnly(inp.value).slice(0, 6);
        inp.value = val;
        errBox.hidden = true;
        drawBoxes(val);

        if (val.length === 6) {
          locked = true;
          if (val === '000000') {
            triesLeft = Math.max(0, triesLeft - 1);
            errBox.querySelector('span').textContent = triesLeft > 0
              ? `Mã không đúng. Còn ${triesLeft} lần thử.`
              : 'Bạn đã nhập sai nhiều lần. Gửi lại mã mới.';
            errBox.hidden = false;
            triggerShake(row);
            drawBoxes('', true);
            inp.value = '';
            setTimeout(() => { locked = false; drawBoxes(''); focusInput(); }, 380);
          } else {
            boxes.forEach((b, i) => setTimeout(() => { if (el.isConnected) b.classList.add('ok'); }, i * 40));
            setTimeout(() => { if (el.isConnected) App.go('bioSetup'); }, 400);
          }
        }
      });

      const renderResend = () => {
        if (sec > 0) {
          const s = String(sec).padStart(2, '0');
          resendEl.innerHTML = `Gửi lại mã sau <span class="num">0:${s}</span>`;
        } else {
          resendEl.innerHTML = '<button type="button" data-resend>Gửi lại mã</button>';
          resendEl.querySelector('[data-resend]').addEventListener('click', () => {
            App.toast('Đã gửi mã mới');
            sec = 45;
            triesLeft = 5;
            renderResend();
          });
        }
      };

      const timer = setInterval(() => {
        if (!el.isConnected) { clearInterval(timer); return; }
        if (sec > 0) { sec--; renderResend(); }
      }, 1000);
    },
  });

  // ---------- 3. Bật Face ID ----------
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

      enableBtn.addEventListener('click', async () => {
        enableBtn.disabled = true;
        errEl.textContent = '';
        const ok = await App.faceId();
        if (!el.isConnected) return;
        enableBtn.disabled = false;
        if (ok) {
          App.toast('Đã bật Face ID');
          App.go('pinSetup');
        } else {
          errEl.textContent = 'Face ID không khớp. Thử lại hoặc để sau.';
        }
      });

      el.querySelector('[data-skip]').addEventListener('click', () => App.go('pinSetup'));
    },
  });

  // ---------- 4. Tạo / Đổi mã PIN ----------
  function renderPinDone() {
    return `<div class="au-done">
      <div class="au-done-ring">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path pathLength="1" d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      <h2>Đã sẵn sàng</h2>
      <p>Từ giờ bạn duyệt đăng nhập web ngay trên điện thoại.</p>
    </div>`;
  }

  App.screen('pinSetup', {
    render: (p) => {
      const isChange = p.mode === 'change';
      const head = isChange ? App.header({ title: '', back: true }) : '';
      if (p.done) {
        return `${head}<div class="au-wrap${isChange ? ' has-nav' : ''}">${renderPinDone()}</div>`;
      }
      const title = isChange ? 'Đổi mã PIN' : 'Tạo mã PIN 6 số';
      const err = p.mismatch ? 'Hai lần nhập không giống nhau. Nhập lại từ đầu.' : '';
      return `${head}<div class="au-wrap${isChange ? ' has-nav' : ''}">
        <div class="au-pin-top">
          <h1 class="au-pin-title">${App.esc(title)}</h1>
          <p class="au-pin-sub">Dùng khi Face ID không nhận ra bạn.</p>
          ${renderDots(6)}
          <div class="au-pin-err">${App.esc(err)}</div>
        </div>
        ${renderKeypad(false)}
      </div>`;
    },
    mount: (el, p) => {
      if (p.done) return;
      const isChange = p.mode === 'change';
      const wrap = el.querySelector('.au-wrap');
      const titleEl = el.querySelector('.au-pin-title');
      const dotsWrap = el.querySelector('.au-dots');
      const dots = [...el.querySelectorAll('.au-dot')];
      const errEl = el.querySelector('.au-pin-err');

      let step = 1;
      let firstPin = '';
      let val = '';
      let locked = false;

      if (p.mismatch) triggerShake(dotsWrap);

      const paintDots = (ok = false) => {
        dots.forEach((d, i) => {
          d.classList.toggle('on', !ok && i < val.length);
          d.classList.toggle('ok', ok && i < 6);
        });
      };

      const setTitle = (txt) => {
        titleEl.classList.add('fade');
        setTimeout(() => {
          if (!el.isConnected) return;
          titleEl.textContent = txt;
          titleEl.classList.remove('fade');
        }, 160);
      };

      const resetInput = (msg) => {
        locked = true;
        errEl.textContent = msg;
        triggerShake(dotsWrap);
        setTimeout(() => {
          if (!el.isConnected) return;
          val = '';
          paintDots();
          locked = false;
        }, 320);
      };

      bindKeypad(el, (digit) => {
        if (locked || val.length >= 6) return;
        errEl.textContent = '';
        val += digit;
        paintDots();

        if (val.length === 6) {
          if (step === 1) {
            if (isWeakPin(val)) {
              resetInput('Mã quá dễ đoán. Chọn mã khác.');
              return;
            }
            firstPin = val;
            locked = true;
            setTimeout(() => {
              if (!el.isConnected) return;
              step = 2;
              val = '';
              paintDots();
              setTitle('Nhập lại mã PIN');
              locked = false;
            }, 220);
          } else if (val !== firstPin) {
            step = 1;
            firstPin = '';
            setTitle(isChange ? 'Đổi mã PIN' : 'Tạo mã PIN 6 số');
            resetInput('Hai lần nhập không giống nhau. Nhập lại từ đầu.');
          } else {
            locked = true;
            paintDots(true);
            setTimeout(() => {
              if (!el.isConnected) return;
              if (isChange) {
                App.toast('Đã đổi mã PIN');
                App.back();
              } else {
                wrap.innerHTML = renderPinDone();
                setTimeout(() => {
                  if (el.isConnected && App.current().el === el) App.reset('home', {}, 'fade');
                }, 1200);
              }
            }, 260);
          }
        }
      }, () => {
        if (locked || !val.length) return;
        val = val.slice(0, -1);
        paintDots();
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
          <h1 class="au-lock-hi">Chào anh ${App.esc(firstName)}</h1>
          <p class="au-lock-store">${App.esc(DATA.store.name)}</p>
        </div>
        <div class="au-lock-pin${p.showPin ? ' show' : ''}">
          ${renderDots(6)}
          <div class="au-pin-err"></div>
          ${renderKeypad(true)}
        </div>
        <div class="au-lock-acts">
          <button type="button" data-faceid>Dùng Face ID</button>
          <button type="button" data-other>Đăng nhập tài khoản khác</button>
        </div>
      </div>`;
    },
    mount: (el, p) => {
      const pinArea = el.querySelector('.au-lock-pin');
      const dotsWrap = el.querySelector('.au-dots');
      const dots = [...el.querySelectorAll('.au-dot')];
      const errEl = el.querySelector('.au-pin-err');

      let val = '';
      let triesLeft = 5;
      let locked = false;

      const paintDots = (ok = false) => {
        dots.forEach((d, i) => {
          d.classList.toggle('on', !ok && i < val.length);
          d.classList.toggle('ok', ok && i < 6);
        });
      };

      const runFaceId = async () => {
        const ok = await App.faceId();
        if (!el.isConnected || App.current().el !== el) return;
        if (ok) App.reset('home', {}, 'fade');
        else pinArea.classList.add('show');
      };

      if (!p.showPin) {
        setTimeout(() => {
          if (el.isConnected && App.current().el === el) runFaceId();
        }, 400);
      }

      bindKeypad(el, (digit) => {
        if (!pinArea.classList.contains('show') || locked || val.length >= 6) return;
        errEl.textContent = '';
        val += digit;
        paintDots();

        if (val.length === 6) {
          if (val === SAMPLE_PIN) {
            locked = true;
            paintDots(true);
            setTimeout(() => { if (el.isConnected) App.reset('home', {}, 'fade'); }, 220);
          } else {
            triesLeft = Math.max(0, triesLeft - 1);
            errEl.textContent = triesLeft > 0
              ? `Sai mã PIN. Còn ${triesLeft} lần thử.`
              : 'Đã thử nhiều lần. Hãy dùng Face ID hoặc đăng nhập lại.';
            locked = true;
            triggerShake(dotsWrap);
            setTimeout(() => {
              if (!el.isConnected) return;
              val = '';
              paintDots();
              locked = false;
            }, 320);
          }
        }
      }, () => {
        if (!pinArea.classList.contains('show') || locked || !val.length) return;
        val = val.slice(0, -1);
        paintDots();
      });

      el.querySelector('[data-faceid]').addEventListener('click', runFaceId);
      el.querySelector('[data-other]').addEventListener('click', () => App.reset('login'));
    },
  });

  // ---------- Trạng thái QA ----------
  App.state('Đăng nhập', () => App.reset('login'), 'Đăng nhập');
  App.state('Đăng nhập: lỗi số điện thoại', () => App.reset('login', { phone: '0903 12', phoneError: true }), 'Đăng nhập');
  App.state('Nhập OTP', () => App.reset('otp', { phone: DATA.owner.phone }), 'Đăng nhập');
  App.state('OTP sai', () => App.reset('otp', { phone: DATA.owner.phone, error: true }), 'Đăng nhập');
  App.state('Bật Face ID', () => App.reset('bioSetup'), 'Đăng nhập');
  App.state('Tạo mã PIN', () => App.reset('pinSetup'), 'Đăng nhập');
  App.state('Tạo mã PIN: hai lần khác nhau', () => App.reset('pinSetup', { mismatch: true }), 'Đăng nhập');
  App.state('Hoàn tất cài đặt', () => App.reset('pinSetup', { done: true }), 'Đăng nhập');
  App.state('Khóa app (Face ID)', () => App.reset('lock'), 'Đăng nhập');
  App.state('Khóa app (nhập PIN)', () => App.reset('lock', { showPin: true }), 'Đăng nhập');
})();
