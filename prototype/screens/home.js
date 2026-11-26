/* Trang chủ — màn mẫu chuẩn cho các màn khác.
   Dấu ấn: dải doanh thu như cuộn hóa đơn in ở quầy (mép răng cưa), cột theo giờ mở cửa. */
App.css(`
.hm-band { position: relative; background: var(--brand-grad); color: var(--on-dark); padding: calc(var(--sat) + 8px) 20px 36px;
  -webkit-mask: radial-gradient(circle 7px at 50% 100%, transparent 96%, black 100%) 0 0 / 20px 100% repeat-x;
          mask: radial-gradient(circle 7px at 50% 100%, transparent 96%, black 100%) 0 0 / 20px 100% repeat-x; }
.hm-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hm-store { display: flex; align-items: center; gap: 12px; min-width: 0; }
.hm-logo { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex: none; }
.hm-logo svg { width: 34px; height: 34px; color: var(--on-dark); }
.hm-store b { display: block; font-size: 17px; font-weight: 600; }
.hm-store span { display: block; font-size: 13px; color: var(--on-dark-2); margin-top: 2px; min-height: 18px; }
.hm-top .nav-btn { color: var(--on-dark); flex: none; }
.hm-head { display: flex; justify-content: space-between; align-items: baseline; margin-top: 28px; }
.hm-label { font-size: 15px; color: var(--on-dark-2); }
.hm-more { font-size: 14px; font-weight: 600; color: var(--mint); display: inline-flex; align-items: center; gap: 2px; }
.hm-total { display: inline-flex; align-items: baseline; gap: 8px; margin-top: 6px; font-weight: 800; letter-spacing: -.02em; }
.hm-v { font-size: 44px; line-height: 1.15; }
.hm-cur { font-size: 24px; font-weight: 600; opacity: .7; }
.hm-delta { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 14px; font-weight: 600; color: var(--mint); min-height: 20px; }
.hm-bars { display: grid; grid-template-columns: repeat(16, 1fr); align-items: end; height: 76px; margin-top: 24px; }
.hm-bar { justify-self: center; width: 12px; border-radius: 6px; background: rgba(244, 251, 250, .34); transform-origin: bottom; transform: scaleY(0); }
.hm-bar.now { background: var(--mint); }
.hm-bar.later { background: rgba(244, 251, 250, .16); }
.hm-bars.grow .hm-bar { animation: hmGrow .6s var(--spring) forwards; }
@keyframes hmGrow { to { transform: none; } }
.hm-axis { display: grid; grid-template-columns: repeat(16, 1fr); margin-top: 8px; font-size: 12px; color: var(--on-dark-2); }
.hm-axis span { justify-self: center; white-space: nowrap; }
.hm-foot { margin-top: 16px; font-size: 14px; color: var(--on-dark-2); display: inline-block; min-height: 20px; }
.hm-web { margin: 20px 16px 0; padding: 4px 0; }
.hm-web .row { min-height: 72px; }
.hm-recent .row { padding: 12px 20px; }
.hm-recent .row + .row::before { left: 20px; }
.hm-time { width: 44px; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.hm-mini { position: sticky; top: 0; height: 0; z-index: 25; }
.hm-mini > div { position: absolute; left: 0; right: 0; top: 0; padding: calc(var(--sat) + 2px) 20px 10px; display: flex; justify-content: space-between;
  align-items: center; font-size: 15px; font-weight: 600; opacity: 0; transform: translateY(-100%); transition: opacity .25s var(--ease), transform .35s var(--ease); pointer-events: none; }
.hm-mini.show > div { opacity: 1; transform: none; pointer-events: auto; }
.hm-mini .num { color: var(--teal-700); }
.hm-err { margin: 24px 16px; padding: 24px 20px; text-align: center; }
.hm-err p { font-size: 15px; color: var(--ink-2); margin-bottom: 14px; }
`);

(function () {
  let firstHome = true;
  const itemsText = (a) => (a.length <= 2 ? a.join(', ') : `${a.slice(0, 2).join(', ')} và ${a.length - 2} món khác`);
  const barHtml = (hourly, hourStart, nowHour) => {
    const arr = hourly && hourly.length ? hourly : Array(16).fill(0);
    const max = Math.max(...arr, 1);
    const nowIdx = nowHour - hourStart;
    return arr.map((v, i) => {
      const later = i > nowIdx;
      const h = later ? 4 : Math.max(6, Math.round((v / max) * 72));
      return `<span class="hm-bar${i === nowIdx ? ' now' : ''}${later ? ' later' : ''}" style="height:${h}px;animation-delay:${i * 28}ms"></span>`;
    }).join('');
  };

  App.screen('home', {
    tab: 'home',
    statusLight: true,
    render: () => {
      const axis = [[1, '7h'], [6, '12h'], [11, '17h'], [16, '22h']].map(([c, l]) => `<span style="grid-column:${c}">${l}</span>`).join('');
      const skelBars = barHtml(Array(16).fill(0), 7, 14);
      return `
        <div class="hm-mini"><div class="glass-strong"><span class="ell">${App.esc(DATA.store.name)}</span><span class="num">0 ₫</span></div></div>
        <div class="hm-band on-dark">
          <div class="hm-top">
            <div class="hm-store"><div class="hm-logo glass-clear">${App.logoMark()}</div>
              <div class="row-main"><b class="ell">${App.esc(DATA.store.name)}</b><span data-skel class="hm-date">Hôm nay</span></div></div>
            <button class="nav-btn glass-clear tap" data-go="notifications" aria-label="Thông báo">${App.icon('bell', 22)}</button>
          </div>
          <div class="hm-head"><span class="hm-label">Doanh thu hôm nay</span>
            <button class="hm-more" data-tab="revenue">Chi tiết${App.icon('chev', 16)}</button></div>
          <div class="hm-total num" data-skel><span class="hm-v">0</span><span class="hm-cur">₫</span></div><br>
          <div class="hm-delta" data-skel>Đang tải số liệu</div>
          <div class="hm-bars" aria-label="Doanh thu theo giờ">${skelBars}</div>
          <div class="hm-axis">${axis}</div>
          <div class="hm-foot" data-skel>Đang tải hóa đơn</div>
        </div>

        <div class="hm-body">
          <div class="card hm-web tap" data-go="webSessions">
            <div class="row"><div class="tile">${App.icon('monitor', 20)}</div>
              <div class="row-main"><div class="row-title" data-skel>Web quản lý</div>
                <div class="row-sub" data-skel>Đang kiểm tra phiên</div></div>
              <div class="row-end">${App.icon('chev', 20)}</div></div>
          </div>

          <div class="section hm-todo-sec"><div class="section-head"><h2>Cần xử lý</h2></div>
            <div class="card hm-todo" style="margin:0 16px">
              <div class="row"><div class="tile warn">${App.icon('box', 20)}</div>
                <div class="row-main"><div class="row-title" data-skel>Đang tải tồn kho</div><div class="row-sub" data-skel>Vui lòng chờ</div></div>
                <div class="row-end">${App.icon('chev', 20)}</div></div>
              <div class="row"><div class="tile">${App.icon('wallet', 20)}</div>
                <div class="row-main"><div class="row-title" data-skel>Công nợ nhà cung cấp</div><div class="row-sub" data-skel>Vui lòng chờ</div></div>
                <div class="row-end num" data-skel>0 ₫</div></div>
            </div></div>

          <div class="section hm-recent"><div class="section-head"><h2>Bán gần đây</h2><a data-go="invoices">Xem tất cả</a></div>
            <div class="hm-recent-list">
              ${[0, 1, 2].map(() => `
                <div class="row">
                  <div class="hm-time num" data-skel>00:00</div>
                  <div class="row-main"><div class="row-title" data-skel>Đang tải hóa đơn</div><div class="row-sub" data-skel>Vui lòng chờ</div></div>
                  <div class="row-end num" data-skel>0 ₫</div></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="hm-err-wrap" hidden></div>`;
    },
    mount: (el) => {
      const band = el.querySelector('.hm-band');
      const mini = el.querySelector('.hm-mini');
      el.addEventListener('scroll', () => {
        const past = el.scrollTop > band.offsetHeight - 90;
        mini.classList.toggle('show', past);
        if (App.current().el === el) App.setStatusLight(!past);
      }, { passive: true });

      const load = async (fresh) => {
        el.classList.add('loading');
        const bodyEl = el.querySelector('.hm-body');
        const errEl = el.querySelector('.hm-err-wrap');
        bodyEl.hidden = false;
        errEl.hidden = true;

        const [dash, wsRes] = await Promise.all([API.dashboard(fresh), API.webSessions.list()]);
        if (!el.isConnected) return;
        el.classList.remove('loading');

        if (!dash.ok) {
          App.toast(dash.error, 'alert');
          bodyEl.hidden = true;
          errEl.hidden = false;
          errEl.innerHTML = `<div class="card hm-err"><p>${App.esc(dash.error)}</p><button class="btn btn-secondary tap" data-retry>Thử lại</button></div>`;
          errEl.querySelector('[data-retry]').addEventListener('click', () => load(true));
          return;
        }

        const isStaff = dash.role === 'staff';
        const t = dash.today;
        el.querySelector('.hm-date').textContent = t.dateLabel || '';
        el.querySelector('.hm-label').textContent = isStaff ? 'Doanh số của bạn' : 'Doanh thu hôm nay';
        el.querySelector('.hm-mini .num').textContent = App.money(t.revenue);

        const vEl = el.querySelector('.hm-v');
        if (firstHome) {
          firstHome = false;
          App.countUp(vEl, t.revenue, 900);
        } else {
          vEl.textContent = App.num(t.revenue);
        }

        const deltaEl = el.querySelector('.hm-delta');
        if (t.yesterday > 0) {
          const delta = ((t.revenue - t.yesterday) / t.yesterday) * 100;
          const up = delta >= 0;
          deltaEl.innerHTML = `${App.icon(up ? 'up' : 'downRight', 16)}${up ? 'Cao hơn' : 'Thấp hơn'} hôm qua ${App.pct(Math.abs(Math.round(delta * 10) / 10))}`;
        } else {
          deltaEl.textContent = 'Chưa có số liệu hôm qua';
        }

        const bars = el.querySelector('.hm-bars');
        bars.innerHTML = barHtml(t.hourly, t.hourStart, t.nowHour);
        void bars.offsetWidth;
        bars.classList.add('grow');

        el.querySelector('.hm-foot').textContent = t.invoices > 0
          ? `${t.invoices} hóa đơn${t.lastSale ? `, đơn gần nhất lúc ${t.lastSale}` : ''}`
          : 'Chưa có hóa đơn hôm nay';

        // Thẻ phiên web: ẩn khi 0 phiên
        const webEl = el.querySelector('.hm-web');
        const ws = wsRes.ok ? wsRes.sessions : [];
        if (ws.length) {
          webEl.hidden = false;
          webEl.querySelector('.row-title').textContent = `Web quản lý đang mở ${ws.length} phiên`;
          webEl.querySelector('.row-sub').textContent = `${ws[0].browser} trên ${ws[0].device || ws[0].os}, từ ${ws[0].since}`;
        } else {
          webEl.hidden = true;
        }

        // Cần xử lý
        const ls = dash.lowStock || [];
        const ex = dash.expiring || [];
        const payables = isStaff ? [] : (dash.payables || []);
        const todoRows = [];
        if (ls.length) {
          todoRows.push(`<div class="row tap" data-go="lowStock"><div class="tile warn">${App.icon('box', 20)}</div>
            <div class="row-main"><div class="row-title">${ls.length} thuốc sắp hết hàng</div><div class="row-sub">${App.esc(ls[0].name)} còn ${ls[0].left} ${App.esc(ls[0].unit)}</div></div>
            <div class="row-end">${App.icon('chev', 20)}</div></div>`);
        }
        if (ex.length) {
          todoRows.push(`<div class="row tap" data-go="expiring"><div class="tile warn">${App.icon('clock', 20)}</div>
            <div class="row-main"><div class="row-title">${ex.length} lô hết hạn trong 30 ngày</div><div class="row-sub">${App.esc(ex[0].name)}, hết hạn ${App.esc(ex[0].exp)}</div></div>
            <div class="row-end">${App.icon('chev', 20)}</div></div>`);
        }
        if (payables.length) {
          const pay = payables[0];
          const paySub = pay.since ? `Từ ${pay.since}, ${pay.count} phiếu` : `Hạn ${pay.due}`;
          todoRows.push(`<div class="row tap" data-go="payables"><div class="tile">${App.icon('wallet', 20)}</div>
            <div class="row-main"><div class="row-title">Công nợ nhà cung cấp</div><div class="row-sub ell">${App.esc(pay.supplier)}, ${App.esc(paySub)}</div></div>
            <div class="row-end num">${App.money(pay.amount)}</div></div>`);
        }
        const todoSec = el.querySelector('.hm-todo-sec');
        if (todoRows.length) {
          todoSec.hidden = false;
          el.querySelector('.hm-todo').innerHTML = todoRows.join('');
        } else {
          todoSec.hidden = true;
        }

        // Bán gần đây
        const recent = (dash.invoices || []).slice(0, 4);
        el.querySelector('.hm-recent-list').innerHTML = recent.length
          ? recent.map((iv) => `
            <div class="row tap" data-go="invoiceDetail" data-p='${JSON.stringify({ id: iv.id })}'>
              <div class="hm-time num">${App.esc(iv.time)}</div>
              <div class="row-main"><div class="row-title">${App.esc(itemsText(iv.items))}</div><div class="row-sub">${App.esc(iv.staff)}, ${App.esc(iv.pay.toLowerCase())}</div></div>
              <div class="row-end num">${App.money(iv.total)}</div></div>`).join('')
          : `<div class="row" style="cursor:default"><div class="row-main"><div class="row-sub">Chưa có hóa đơn hôm nay</div></div></div>`;
      };

      load(false);
      const k = window.API && API.push && API.push.takeOpened();
      // Chờ hiệu ứng vào Trang chủ xong (dài nhất 720ms) rồi mới chuyển màn; người dùng đã rời Trang chủ thì thôi
      if (k !== null) setTimeout(() => { if (App.current().el === el) App.openNotif(k); }, 800);
    },
  });

  App.state('Trang chủ', () => App.reset('home'), 'Trang chủ');
})();
