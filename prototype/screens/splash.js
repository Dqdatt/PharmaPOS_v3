/* Splash: frame đầu chỉ là nền gradient (khớp splash native), logo tự vẽ, rồi mở vòng sang màn kế. Claude giữ. */
App.css(`
.splash { position: absolute; inset: 0; background: var(--brand-grad); display: grid; place-items: center; color: var(--on-dark); overflow: hidden; }
.sp-center { display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: -40px; }
.sp-mark { position: relative; width: 128px; height: 128px; }
.sp-mark svg { width: 100%; height: 100%; position: relative; }
.sp-mark .lm-back { opacity: 0; transform: translate(-90px, 90px); animation: spBack .6s var(--ease) .1s forwards; }
.sp-mark .lm-doc { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; transform: scale(.5); animation: spDoc .65s var(--pop) .35s forwards; }
.sp-halo { position: absolute; inset: -30px; border-radius: 50%; border: 1.5px solid rgba(159, 240, 226, .55); opacity: 0; animation: spHalo 1.1s var(--ease) .8s forwards; }
.sp-word { font-size: 30px; font-weight: 600; letter-spacing: .28em; opacity: 0; transform: translateY(10px); animation: spWord .7s var(--ease) .95s forwards; }
.sp-word b { font-weight: 800; }
@keyframes spBack { to { opacity: 1; transform: none; } }
@keyframes spDoc { to { opacity: 1; transform: none; } }
@keyframes spHalo { 0% { opacity: .9; transform: scale(.55); } 100% { opacity: 0; transform: scale(1.5); } }
@keyframes spWord { to { opacity: 1; transform: none; letter-spacing: .01em; } }
`);

App.screen('splash', {
  statusLight: true,
  render: () => `<div class="splash"><div class="sp-center">
      <div class="sp-mark"><span class="sp-halo"></span>${App.logoMark()}</div>
      <div class="sp-word">Medi<b>POS</b></div>
    </div></div>`,
  mount: (el, p) => {
    // Live: phiên 'invited' (đã qua mã, chưa đặt mật khẩu) → Tạo mật khẩu; còn phiên → Face ID (nếu bật) hoặc Trang chủ;
    // không phiên → Đăng nhập. Chạy song song animation.
    const route = (p.next || !API.live) ? Promise.resolve([p.next])
      : API.profile().then((me) => !me ? []
        : me.status === 'invited' ? ['password', { status: 'invited' }]
        : [API.bio.enabled() && App.screens.lock ? 'lock' : 'home']);
    Promise.all([route, new Promise((r) => setTimeout(r, 1850))]).then(([[next, np]]) => {
      if (App.current().el !== el) return; // đã nhảy màn khác từ bảng QA
      App.reset(next || (App.screens.login ? 'login' : 'home'), np || {}, 'reveal');
    });
  },
});

App.state('Splash → Đăng nhập', () => App.reset('splash', {}, 'none'), 'Mở app');
App.state('Splash → Trang chủ (đã đăng nhập)', () => App.reset('splash', { next: 'home' }, 'none'), 'Mở app');
