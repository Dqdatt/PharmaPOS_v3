/* Đăng nhập web bằng điện thoại — các yêu cầu và phiên chỉ dùng dữ liệu mẫu. */
(function () {
  const request = DATA.webRequest;
  let sessions = [...DATA.webSessions];
  let loginHistory = [
    { id: 'h1', status: 'ok', title: 'Đã duyệt Chrome trên MacBook Pro', meta: 'Quận 3, TP.HCM, 08:12 hôm nay' },
    { id: 'h2', status: 'bad', title: 'Đã từ chối Edge trên Windows', meta: 'Quận 7, TP.HCM, 22:41 hôm qua' },
    { id: 'h3', status: 'exp', title: 'Yêu cầu hết hạn, Safari trên iPhone', meta: 'Quận 3, TP.HCM, 19:05 hôm qua' },
    { id: 'h4', status: 'ok', title: 'Đã duyệt Safari trên iMac quầy thuốc', meta: 'Quận 3, TP.HCM, 07:55 hôm qua' },
    { id: 'h5', status: 'ok', title: 'Đã duyệt Chrome trên MacBook Pro', meta: 'Quận 3, TP.HCM, 08:04 ngày 23/11' },
  ];
  const active = (el) => el.isConnected && App.current()?.el === el;

  App.icons.wlTorch = '<path d="M8 3h8v4l-2 4v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-9L8 7zM8 7h8M12 14v2"/>';
  App.icons.wlTorchOn = App.icons.wlTorch + '<path d="m3 5 2 1m16-1-2 1M4 10l2-1m14 1-2-1"/>';

  App.css(`
.wl-camera { min-height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; color: var(--on-dark);
  padding: calc(var(--sat) + 4px) 16px var(--sab);
  background: repeating-radial-gradient(circle at 27% 39%, color-mix(in srgb, var(--on-dark) 3%, transparent) 0 .6px, transparent 1px 4px) var(--teal-950); }
.wl-camera-top { position: relative; z-index: 1; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; gap: 8px; align-items: center; }
.wl-camera-top .nav-btn { color: var(--on-dark); }
.wl-camera-center { display: grid; place-items: center; flex: 1; padding: 24px 0; }
.wl-camera-frame { width: 248px; height: 248px; position: relative; display: grid; place-items: center; border-radius: 24px;
  color: var(--on-dark); box-shadow: 0 0 0 999px color-mix(in srgb, var(--ink) 56%, transparent);
  transition: width .35s var(--pop), height .35s var(--pop), color .25s var(--ease); animation: wlBreathe 2.8s var(--ease) infinite; }
.wl-camera-frame.wl-found { width: 148px; height: 148px; color: var(--mint); animation: none; }
.wl-found::after { content: ""; position: absolute; inset: 0; border: 1px solid var(--mint); border-radius: inherit;
  animation: wlFlash .35s var(--ease) both; }
.wl-corner { position: absolute; width: 36px; height: 36px; border: solid currentColor; }
.wl-corner:nth-child(1) { inset: 0 auto auto 0; border-width: 4px 0 0 4px; border-top-left-radius: 24px; }
.wl-corner:nth-child(2) { inset: 0 0 auto auto; border-width: 4px 4px 0 0; border-top-right-radius: 24px; }
.wl-corner:nth-child(3) { inset: auto 0 0 auto; border-width: 0 4px 4px 0; border-bottom-right-radius: 24px; }
.wl-corner:nth-child(4) { inset: auto auto 0 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 24px; }
.wl-scan-line { position: absolute; inset: 10% 8px auto; height: 1px; background: var(--mint); animation: wlSweep 2s var(--ease) infinite; }
.wl-camera-frame .ic, .wl-found .wl-scan-line { visibility: hidden; }
.wl-found .ic { visibility: visible; }
@keyframes wlBreathe { 0%, 100% { transform: scale(.98); } 50% { transform: scale(1); } }
@keyframes wlSweep { 50% { top: 90%; } }
@keyframes wlFlash { from { opacity: 1; } to { opacity: 0; } }
.wl-camera-help { z-index: 1; display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 24px; }
.wl-camera-help p { font-size: 15px; line-height: 1.5; }
.wl-torch { flex: none; width: 44px; height: 44px; border: 1px solid var(--on-dark-2); border-radius: 50%; display: grid; place-items: center; }
.wl-torch[aria-pressed="true"] { background: var(--mint); color: var(--teal-950); border-color: var(--mint); }
.wl-camera-denied { color: var(--on-dark); max-width: 350px; }
.wl-camera-denied .btn, .wl-session-empty .btn { margin-top: 20px; }

.wl-confirm { min-height: calc(100% - var(--sat) - 56px); display: flex; flex-direction: column; padding: 0 16px var(--sab); }
.wl-confirm .page-title { padding-left: 4px; padding-right: 4px; }
.wl-warning { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; padding: 12px; border-radius: var(--radius-sm);
  background: var(--warn-soft); color: var(--ink); font-size: 14px; line-height: 1.45; }
.wl-warning .ic { color: var(--warn); }
.wl-ticket { margin: 0; padding: 18px 16px 12px; border-radius: 0 0 var(--radius) var(--radius);
  -webkit-mask: radial-gradient(circle 6px at 50% 0, transparent 95%, var(--ink) 100%) 0 0 / 18px 100% repeat-x;
          mask: radial-gradient(circle 6px at 50% 0, transparent 95%, var(--ink) 100%) 0 0 / 18px 100% repeat-x; }
.wl-ticket > div { display: grid; grid-template-columns: 91px minmax(0, 1fr); align-items: baseline; gap: 10px; padding: 5px 0; }
.wl-ticket > div + div { border-top: 1px solid var(--line); }
.wl-ticket dt { font-size: 13px; color: var(--ink-2); }
.wl-ticket dd { margin: 0; font-size: 15px; line-height: 1.35; font-weight: 500; overflow-wrap: anywhere; }
.wl-expiry { display: flex; align-items: center; gap: 6px; margin: 14px 4px 12px; color: var(--ink-2); font-size: 14px; }
.wl-prompt { margin: 0 4px 10px; font-size: 15px; font-weight: 600; line-height: 1.4; }
.wl-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 96px)); justify-content: space-between; gap: 8px; padding: 0 4px; }
.wl-choice { height: 88px; border-radius: 20px; font-size: 34px; font-weight: 700; transition: background .2s var(--ease), transform .3s var(--pop); }
.wl-choice:disabled { cursor: default; background: var(--soft); color: var(--ink-3); }
.wl-choice.wl-correct { background: var(--teal-700); border-color: var(--teal-700); color: var(--on-dark); animation: wlChoicePop .35s var(--pop); }
.wl-choice.wl-wrong { background: var(--bad-soft); color: var(--bad); animation: shake .45s var(--ease); }
@keyframes wlChoicePop { 50% { transform: scale(1.07); } }
.wl-feedback { min-height: 66px; padding: 8px 4px; font-size: 14px; line-height: 1.45; color: var(--bad); }
.wl-feedback .btn { height: 34px; padding: 0; font-size: 14px; }
.wl-confirm-actions { margin-top: auto; }
.wl-cancelled { flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 24px 8px; }
.wl-cancelled .tile { width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 23px; }
.wl-cancelled h1, .wl-done h1 { font-size: 24px; line-height: 1.3; overflow-wrap: anywhere; }
.wl-cancelled p, .wl-done p { margin: 12px 0 24px; font-size: 15px; line-height: 1.5; color: var(--ink-2); }
.wl-sheet-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 20px; }
.wl-sheet-actions .btn { padding: 0 8px; }
.wl-rescan { margin-top: 20px; }

.wl-done { min-height: 100%; padding: var(--sat) 24px var(--sab); display: flex; flex-direction: column; justify-content: center; text-align: center; }
.wl-done-mark { position: relative; display: grid; place-items: center; width: 120px; height: 120px; border-radius: 50%;
  margin: 0 auto 28px; background: var(--ok-soft); color: var(--ok); }
.wl-done-mark::before { content: ""; position: absolute; inset: 0; border: 1px solid var(--ok); border-radius: 50%;
  animation: wlRing .6s var(--ease) both; }
.wl-done-mark path { stroke-dasharray: 1; animation: wlCheck .45s var(--ease) both; }
@keyframes wlRing { from { transform: scale(1); opacity: .4; } to { transform: scale(1.6); opacity: 0; } }
@keyframes wlCheck { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }

.wl-sessions-view .nav { grid-template-columns: 44px minmax(0, 1fr) 44px; }
.wl-sessions { padding: 8px 16px var(--sab); }
.wl-session { overflow: hidden; transition: height .35s var(--ease), opacity .35s var(--ease); }
.wl-session.wl-removing { opacity: 0; }
.wl-session .card { margin-bottom: 12px; padding: 14px; }
.wl-session .row { grid-template-columns: auto minmax(0, 1fr); align-items: start; padding: 0; cursor: default; }
.wl-session .row-title { font-size: 16px; font-weight: 600; overflow-wrap: anywhere; }
.wl-session-place { margin-top: 2px; font-size: 14px; color: var(--ink-2); overflow-wrap: anywhere; }
.wl-session .row-sub { margin-top: 5px; overflow-wrap: anywhere; }
.wl-session .btn { height: 40px; margin: 12px 0 0 48px; padding: 0 14px; font-size: 14px; }
.wl-session-empty h2 { font-size: 17px; color: var(--ink); }
.wl-session-empty p { margin-top: 8px; }
.wl-sessions-view.loading .wl-sessions { pointer-events: none; }
.wl-history .section-head { padding: 0 4px 12px; }
.wl-history .row { grid-template-columns: auto minmax(0, 1fr); align-items: start; cursor: default; }
.wl-history .row-title { overflow-wrap: anywhere; }
.wl-note { display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; padding: 0 4px 12px; font-size: 13px; line-height: 1.5; color: var(--ink-3); }
.wl-note .ic { margin-top: 1px; }
`);

  function actionSheet({ title, body, cancel, action, busy, delay, onClose, done }) {
    return App.sheet(`
      <h3>${App.esc(title)}</h3><p>${App.esc(body)}</p>
      <div class="wl-sheet-actions">
        <button class="btn btn-secondary" data-close>${App.esc(cancel)}</button>
        <button class="btn btn-danger" data-wl-submit>${App.esc(action)}</button>
      </div>`, {
      onMount(sheet, close) {
        const submit = sheet.querySelector('[data-wl-submit]');
        submit.onclick = () => {
          const wrap = sheet.parentElement;
          if (submit.disabled || !wrap.classList.contains('open')) return;
          App.busy(submit, busy);
          sheet.querySelector('[data-close]').disabled = true;
          wrap.querySelector('.scrim').removeAttribute('data-close');
          setTimeout(() => { close(); done(); }, delay);
        };
      },
      onClose,
    });
  }

  App.screen('webScan', {
    cls: 'dark',
    statusLight: true,
    render: (p) => `
      <div class="wl-camera">
        <header class="wl-camera-top">
          <button class="nav-btn glass-clear tap" data-back aria-label="Đóng máy quét">${App.icon('x', 22)}</button>
          <h1 class="nav-title ell">Quét mã trên web</h1>
        </header>
        ${p.state === 'denied' ? `
          <div class="wl-camera-center"><div class="empty wl-camera-denied">
            <p>PharmaPOS cần camera để quét mã đăng nhập web. Camera chỉ bật khi bạn mở màn này.</p>
            <button class="btn btn-primary tap" data-wl-settings>Mở Cài đặt</button>
          </div></div>` : `
          <div class="wl-camera-center"><div class="wl-camera-frame" aria-hidden="true">
            <span class="wl-corner"></span><span class="wl-corner"></span><span class="wl-corner"></span><span class="wl-corner"></span>
            <span class="wl-scan-line"></span>${App.icon('qr', 96)}
          </div></div>
          <div class="wl-camera-help glass-clear">
            <p>Mở trang đăng nhập PharmaPOS trên máy tính, rồi đưa mã QR vào khung.</p>
            <button class="wl-torch tap" data-wl-torch aria-label="Đèn pin" aria-pressed="false">${App.icon('wlTorch', 22)}</button>
          </div>`}
      </div>`,
    mount(el, p) {
      if (p.state === 'denied') {
        el.querySelector('[data-wl-settings]').onclick = () => App.toast('Mở Cài đặt của iPhone', 'sliders');
        return;
      }
      const torch = el.querySelector('[data-wl-torch]');
      torch.onclick = () => {
        const on = torch.getAttribute('aria-pressed') === 'false';
        torch.setAttribute('aria-pressed', String(on));
        torch.innerHTML = App.icon(on ? 'wlTorchOn' : 'wlTorch', 22);
        App.toast(on ? 'Đã bật đèn' : 'Đã tắt đèn');
      };

      const frame = el.querySelector('.wl-camera-frame');
      let timer;
      const scan = () => {
        clearTimeout(timer);
        frame.classList.remove('wl-found');
        timer = setTimeout(() => {
          if (!active(el)) return;
          frame.classList.add('wl-found');
          const expiresAt = Date.now() + request.expiresIn * 1000;
          timer = setTimeout(() => {
            if (!active(el)) return;
            if (p.state === 'expired') {
              App.sheet(`<h3>Mã đã hết hạn</h3><p>Tải lại trang đăng nhập trên máy tính để lấy mã mới.</p>
                <button class="btn btn-primary block wl-rescan" data-close>Quét lại</button>`,
              { onClose: () => { if (active(el)) scan(); } });
            } else {
              App.go('webConfirm', { from: 'scan', expiresAt }, 'push');
            }
          }, 350);
        }, 1800);
      };
      scan();
    },
  });

  const cancelled = `
    <div class="wl-cancelled" role="status">
      <div class="tile bad">${App.icon('shield', 36)}</div>
      <h1>Đã hủy yêu cầu đăng nhập</h1>
      <p>Số bạn chọn không khớp với máy tính. Nếu không phải bạn đang đăng nhập, hãy đổi mật khẩu web.</p>
      <button class="btn btn-primary block" data-wl-home>Về trang chủ</button>
      <button class="btn btn-ghost block" data-wl-password>Đổi mật khẩu</button>
    </div>`;
  const failedFaceId = `<p>Face ID không khớp.</p><button class="btn btn-ghost" data-wl-retry>Thử lại Face ID</button>`;

  App.screen('webConfirm', {
    render: (p) => {
      const fields = [
        ['Trình duyệt', `${request.browser} trên ${request.os}`],
        ['Máy', request.device],
        ['Vị trí', `${request.place} (ước tính theo IP)`],
        ['Địa chỉ IP', request.ip],
        ['Thời gian', `${request.time} hôm nay`],
      ];
      return `
        <header class="nav"><div class="nav-side">
          <button class="nav-btn glass tap" data-back aria-label="Đóng xác nhận">${App.icon('x', 22)}</button>
        </div></header>
        <div class="wl-confirm">${p.state === 'cancelled' ? cancelled : `
          <h1 class="page-title">Đăng nhập web quản lý?</h1>
          ${p.unusual ? `<div class="wl-warning">${App.icon('alert', 20)}<p>Vị trí này khác nơi bạn thường đăng nhập. Chỉ duyệt nếu chính bạn đang ngồi ở máy đó.</p></div>` : ''}
          <dl class="card wl-ticket">
            ${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${App.esc(value)}</dd></div>`).join('')}
          </dl>
          <div class="wl-expiry">${App.icon('clock', 16)} Hết hạn sau <span class="num" data-wl-time></span></div>
          <p class="wl-prompt" id="wl-prompt">Chọn số đang hiện trên màn hình máy tính</p>
          <div class="wl-choices" role="group" aria-labelledby="wl-prompt">
            ${request.choices.map((code) => `<button class="wl-choice card num tap" data-wl-code="${App.esc(code)}">${App.esc(String(code).padStart(2, '0'))}</button>`).join('')}
          </div>
          <div class="wl-feedback" aria-live="polite"></div>
          <div class="wl-confirm-actions">
            <button class="btn btn-danger block" data-wl-refuse>Không phải tôi, từ chối</button>
          </div>`}
        </div>`;
    },
    mount(el, p) {
      const content = el.querySelector('.wl-confirm');
      const clock = el.querySelector('[data-wl-time]');
      const feedback = el.querySelector('.wl-feedback');
      const actions = el.querySelector('.wl-confirm-actions');
      const choices = [...el.querySelectorAll('[data-wl-code]')];
      const correct = choices.find((btn) => Number(btn.dataset.wlCode) === request.code);
      const expiresAt = Number.isFinite(p.expiresAt) ? p.expiresAt : Date.now() + (p.state === 'expired' ? 3 : request.expiresIn) * 1000;
      let phase = p.state === 'cancelled' ? 'cancelled' : p.state === 'faceIdFailed' ? 'retry' : 'choose';
      let closeRefusal, timer;

      function setChoices(disabled) {
        choices.forEach((btn) => { btn.disabled = disabled; });
      }
      function tick() {
        if (!active(el)) { clearInterval(timer); return false; }
        const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
        if (left) return true;
        clearInterval(timer);
        phase = 'expired';
        closeRefusal?.();
        correct.classList.remove('wl-correct');
        setChoices(true);
        feedback.textContent = 'Yêu cầu đã hết hạn. Tải lại trang web để thử lại.';
        actions.innerHTML = '<button class="btn btn-primary block" data-wl-home>Về trang chủ</button>';
        return false;
      }

      async function approve() {
        if (!tick()) return;
        phase = 'faceId';
        setChoices(true);
        feedback.textContent = '';
        correct.classList.add('wl-correct');
        const matched = await App.faceId();
        if (!active(el) || phase !== 'faceId' || !tick()) return;
        if (matched) {
          clearInterval(timer);
          App.go('webDone', {}, 'fade');
        } else {
          phase = 'retry';
          correct.classList.remove('wl-correct');
          setChoices(false);
          feedback.innerHTML = failedFaceId;
        }
      }

      el.querySelector('[data-back]').onclick = (event) => {
        if (p.from !== 'scan' || (phase !== 'cancelled' && phase !== 'expired')) return;
        event.stopPropagation();
        App.reset('home');
      };

      content.onclick = (event) => {
        const btn = event.target.closest('button');
        if (!btn || btn.disabled) return;
        if (btn.hasAttribute('data-wl-home')) App.reset('home');
        if (btn.hasAttribute('data-wl-password')) App.toast('Đổi mật khẩu trên web, mục Tài khoản', 'info');
        if (closeRefusal || (phase !== 'choose' && phase !== 'retry')) return;
        if (btn.hasAttribute('data-wl-retry')) approve();
        if (btn.hasAttribute('data-wl-code') && tick()) {
          if (btn === correct) {
            approve();
          } else {
            clearInterval(timer);
            phase = 'cancelled';
            setChoices(true);
            actions.querySelector('button').disabled = true;
            btn.classList.add('wl-wrong');
            setTimeout(() => { if (active(el)) content.innerHTML = cancelled; }, 500);
          }
        }
        if (btn.hasAttribute('data-wl-refuse') && tick()) {
          closeRefusal = actionSheet({
            title: 'Từ chối yêu cầu này?',
            body: 'Máy tính sẽ không đăng nhập được. Bạn có thể đăng nhập lại bất cứ lúc nào.',
            cancel: 'Quay lại', action: 'Từ chối', busy: 'Đang từ chối...', delay: 600,
            onClose: () => { closeRefusal = null; },
            done: () => {
              if (!active(el) || phase === 'expired') return;
              clearInterval(timer);
              App.toast('Đã từ chối đăng nhập');
              App.reset('home');
            },
          });
        }
      };

      if (clock) {
        if (phase === 'retry') feedback.innerHTML = failedFaceId;
        timer = setInterval(tick, 1000);
        tick();
      }
    },
  });

  App.screen('webDone', {
    render: () => `
      <div class="wl-done">
        <div class="wl-done-mark">
          <svg class="ic" width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path pathLength="1" d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h1>Đã đăng nhập trên ${App.esc(request.device)}</h1>
        <p>Trang web sẽ tự mở trong vài giây. Phiên tự đăng xuất sau 12 giờ không dùng.</p>
        <button class="btn btn-primary block" data-wl-home>Xong</button>
        <button class="btn btn-ghost block" data-wl-sessions>Xem các phiên web</button>
      </div>`,
    mount(el) {
      const { id, browser, os, device, place, ip, time } = request;
      sessions = [{ id, browser, os, device, place, ip, since: `${time} hôm nay`, lastActive: 'vừa xong' }, ...sessions.filter((session) => session.id !== id)];
      DATA.webSessions = sessions;
      const doneEntry = {
        id: `done-${id}`,
        status: 'ok',
        title: `Đã duyệt ${browser} trên ${device}`,
        meta: `${place}, ${time} hôm nay`,
      };
      loginHistory = [doneEntry, ...loginHistory.filter((item) => item.id !== doneEntry.id)];
      el.querySelector('[data-wl-home]').onclick = () => App.reset('home');
      el.querySelector('[data-wl-sessions]').onclick = () => App.reset('webSessions', { fromDone: true });
    },
  });

  const sessionTitle = (session) => `${session.browser} trên ${session.device}`;
  const historyTile = {
    ok: { cls: ' ok', icon: 'check' },
    bad: { cls: ' bad', icon: 'x' },
    exp: { cls: '', icon: 'clock' },
  };
  function historySection() {
    return `
      <div class="section wl-history">
        <div class="section-head"><h2>Lịch sử đăng nhập web</h2></div>
        <div class="card">
          ${loginHistory.map((item) => {
            const t = historyTile[item.status] || historyTile.exp;
            return `
              <div class="row">
                <div class="tile${t.cls}">${App.icon(t.icon, 20)}</div>
                <div class="row-main">
                  <div class="row-title">${App.esc(item.title)}</div>
                  <div class="row-sub">${App.esc(item.meta)}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div class="wl-note">
        ${App.icon('shield', 18)}
        <span>Mỗi lần đăng nhập web đều cần điện thoại này duyệt. Phiên tự đăng xuất sau 12 giờ không dùng.</span>
      </div>`;
  }
  function sessionList(items) {
    const activeHtml = !items.length ? `
      <div class="empty wl-session-empty">
        <div class="tile">${App.icon('monitor', 28)}</div>
        <h2>Chưa có máy tính nào đăng nhập.</h2>
        <p>Mở trang đăng nhập PharmaPOS trên máy tính rồi quét mã.</p>
        <button class="btn btn-primary tap" data-go="webScan" data-mode="up">Quét mã</button>
      </div>` : items.map((session) => `
      <div class="wl-session" data-wl-session="${App.esc(session.id)}">
        <div class="card">
          <div class="row">
            <div class="tile" data-skel>${App.icon('laptop', 20)}</div>
            <div class="row-main">
              <div class="row-title" data-skel>${App.esc(sessionTitle(session))}</div>
              <div class="wl-session-place" data-skel>${App.esc(session.place)}</div>
              <div class="row-sub" data-skel>Đăng nhập lúc ${App.esc(session.since)}, hoạt động ${App.esc(session.lastActive)}</div>
            </div>
          </div>
          <button class="btn btn-danger tap" data-wl-logout data-skel>Đăng xuất máy này</button>
        </div>
      </div>`).join('') + (items.length >= 2 ? `
      <button class="btn btn-secondary block tap" data-wl-all data-skel>Đăng xuất tất cả máy tính</button>` : '');
    return activeHtml + historySection();
  }

  App.screen('webSessions', {
    cls: 'wl-sessions-view',
    render: (p) => App.header({ title: 'Phiên web đang mở' }) +
      `<div class="wl-sessions">${sessionList(p.empty ? [] : sessions)}</div>`,
    mount(el, p) {
      const list = el.querySelector('.wl-sessions');
      let dialogOpen = false;
      if (p.fromDone) {
        el.querySelector('[data-back]').onclick = (event) => {
          event.stopPropagation();
          App.reset('home');
        };
      }
      if (!p.empty) {
        App.load(el, 'webSessions').then(() => {
          list.querySelectorAll('[data-wl-logout], [data-wl-all]').forEach((btn) => { btn.disabled = false; });
        });
        if (el.classList.contains('loading')) list.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
      }

      list.onclick = (event) => {
        const btn = event.target.closest('[data-wl-logout], [data-wl-all]');
        if (!btn || btn.disabled || dialogOpen) return;
        const cards = [...list.querySelectorAll('[data-wl-session]')];
        const target = btn.closest('[data-wl-session]');
        const session = target && sessions.find((item) => item.id === target.dataset.wlSession);
        if (target && !session) return;
        dialogOpen = true;
        actionSheet({
          title: session ? `Đăng xuất ${sessionTitle(session)}?` : 'Đăng xuất tất cả máy tính?',
          body: session ? 'Trang web trên máy đó quay về màn đăng nhập ngay.' : 'Các trang web trên máy tính sẽ quay về màn đăng nhập ngay.',
          cancel: 'Giữ lại', action: 'Đăng xuất', busy: 'Đang đăng xuất...', delay: 700,
          onClose: () => { dialogOpen = false; },
          done: () => {
            if (!active(el)) return;
            const leaving = target ? [target] : cards;
            const ids = leaving.map((card) => card.dataset.wlSession);
            sessions = sessions.filter((item) => !ids.includes(item.id));
            DATA.webSessions = sessions;
            list.querySelectorAll('button').forEach((button) => { button.disabled = true; });
            leaving.forEach((card) => {
              card.style.height = `${card.offsetHeight}px`;
              void card.offsetHeight;
              card.classList.add('wl-removing');
              card.style.height = '0px';
            });
            setTimeout(() => {
              if (!el.isConnected) return;
              list.innerHTML = sessionList(sessions);
              if (active(el)) App.toast(session ? `Đã đăng xuất ${session.device}` : 'Đã đăng xuất tất cả máy tính');
            }, 350);
          },
        });
      };
    },
  });

  const group = 'Đăng nhập web';
  function preview(name, p) {
    App.reset('home', {}, 'none');
    App.go(name, p, 'none');
  }
  App.state('Quét mã', () => preview('webScan'), group);
  App.state('Quét mã: chưa cấp camera', () => preview('webScan', { state: 'denied' }), group);
  App.state('Quét mã: mã hết hạn', () => preview('webScan', { state: 'expired' }), group);
  App.state('Xác nhận đăng nhập', () => preview('webConfirm'), group);
  App.state('Xác nhận: vị trí lạ', () => preview('webConfirm', { unusual: true }), group);
  App.state('Xác nhận: hết hạn', () => preview('webConfirm', { state: 'expired' }), group);
  App.state('Xác nhận: chọn sai số', () => preview('webConfirm', { state: 'cancelled' }), group);
  App.state('Xác nhận: Face ID không khớp', () => preview('webConfirm', { state: 'faceIdFailed' }), group);
  App.state('Đăng nhập web thành công', () => App.reset('webDone'), group);
  App.state('Web xin đăng nhập (thông báo đẩy)', () => {
    App.reset('home');
    const home = App.current().el;
    setTimeout(() => {
      if (!active(home)) return;
      const expiresAt = Date.now() + request.expiresIn * 1000;
      App.notify({
        title: 'Yêu cầu đăng nhập web',
        body: 'Safari trên iMac quầy thuốc, Quận 3. Chạm để duyệt.',
        onTap: () => { if (active(home)) App.go('webConfirm', { from: 'push', expiresAt }, 'up'); },
      });
    }, 700);
  }, group);
  App.state('Phiên web đang mở', () => preview('webSessions'), group);
  App.state('Phiên web: chưa có', () => preview('webSessions', { empty: true }), group);
})();
