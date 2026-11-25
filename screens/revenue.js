/* Doanh thu + hóa đơn: màn revenue (tab), invoices, invoiceDetail */
App.css(`
.rv-title { padding-top: calc(var(--sat) + 12px); }
.rv-seg-wrap { padding: 0 16px; }
.rv-hero { padding: 20px 20px 0; }
.rv-label { font-size: 15px; color: var(--ink-2); }
.rv-total { display: flex; align-items: baseline; gap: 6px; margin-top: 6px; font-weight: 800; letter-spacing: -.02em; }
.rv-v { font-size: 40px; line-height: 1.15; }
.rv-cur { font-size: 22px; font-weight: 600; color: var(--ink-2); opacity: .7; }
.rv-delta { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 14px; font-weight: 600; min-height: 20px; }
.rv-delta.ok { color: var(--ok); }
.rv-delta.bad { color: var(--bad); }
.rv-delta.neutral { color: var(--ink-2); }

.rv-chart { height: 112px; margin-top: 20px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; }
.rv-bars { display: grid; grid-template-columns: repeat(16, 1fr); align-items: end; height: 76px; }
.rv-bar { justify-self: center; width: 12px; border-radius: 6px; background: var(--teal-200); transform-origin: bottom; transform: scaleY(0); }
.rv-bar.now { background: var(--teal-700); }
.rv-bar.later { background: var(--soft); }
.rv-bars.grow .rv-bar, .rv-wbars.grow .rv-wbar { animation: rvGrow .5s var(--spring) forwards; }
@keyframes rvGrow { to { transform: none; } }
.rv-axis { display: grid; grid-template-columns: repeat(16, 1fr); margin-top: 8px; font-size: 12px; color: var(--ink-3); height: 18px; }
.rv-axis span { justify-self: center; white-space: nowrap; }

.rv-wbars { display: grid; grid-template-columns: repeat(7, 1fr); align-items: end; height: 76px; }
.rv-wcol { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; cursor: pointer; position: relative; }
.rv-wbar { width: 22px; border-radius: 8px; background: var(--teal-200); transform-origin: bottom; transform: scaleY(0); transition: background .2s var(--ease), opacity .2s var(--ease); }
.rv-wbar.now { background: var(--teal-700); }
.rv-wbar.picked { background: var(--teal-800); }
.rv-wbars.has-pick .rv-wbar:not(.picked) { opacity: .45; }
.rv-waxis { display: grid; grid-template-columns: repeat(7, 1fr); margin-top: 8px; font-size: 12px; color: var(--ink-3); height: 18px; text-align: center; }
.rv-waxis span.now { color: var(--teal-700); font-weight: 600; }
.rv-tip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--on-dark);
  padding: 6px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none; z-index: 5;
  box-shadow: 0 6px 16px -6px rgba(10, 40, 38, .35); }
.rv-tip.left { left: 0; transform: none; }
.rv-tip.right { left: auto; right: 0; transform: none; }

.rv-goal { display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 10px; }
.rv-goal-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 600; color: var(--ink); }
.rv-goal-track { height: 12px; border-radius: 6px; background: var(--soft); overflow: hidden; }
.rv-goal-fill { height: 100%; border-radius: 6px; background: var(--teal-600); width: 0; transition: width .6s var(--ease); }
.rv-goal-sub { font-size: 13px; color: var(--ink-2); }

.rv-pay-row { display: block; padding: 14px 16px; cursor: default; }
.rv-pay-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; font-weight: 500; }
.rv-pay-head b { font-weight: 600; }
.rv-pay-track { height: 6px; border-radius: 3px; background: var(--soft); overflow: hidden; margin-top: 8px; }
.rv-pay-fill { height: 100%; border-radius: 3px; background: var(--teal-600); }
.rv-pay-pct { font-size: 13px; color: var(--ink-3); margin-top: 6px; }

.rv-ava { width: 36px; height: 36px; border-radius: 18px; background: var(--teal-50); color: var(--teal-700);
  display: grid; place-items: center; font-size: 13px; font-weight: 700; }
.rv-recent .row { padding: 12px 20px; }
.rv-recent .row + .row::before { left: 20px; }
.rv-time { width: 44px; font-size: 14px; font-weight: 600; color: var(--ink-2); }

.rv-search-wrap { padding: 8px 16px 12px; }
.rv-search { display: flex; align-items: center; gap: 10px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 0 14px; height: 46px; }
.rv-search .ic { color: var(--ink-3); }
.rv-search input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ink); outline: none; }
.rv-search input::placeholder { color: var(--ink-3); }
.rv-inv-summary { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 20px 8px; }
.rv-inv-sum-right { text-align: right; }
.rv-inv-sum-val { font-size: 20px; font-weight: 700; line-height: 1.25; color: var(--ink); }
.rv-inv-sum-sub { font-size: 13px; color: var(--ink-3); margin-top: 2px; }
.rv-chips { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 12px; scrollbar-width: none; }
.rv-chips::-webkit-scrollbar { display: none; }
.rv-chips .chip { flex: none; cursor: pointer; transition: background .2s var(--ease), color .2s var(--ease); }
.rv-chips .chip.on { background: var(--teal-700); color: var(--on-dark); }
.rv-inv-group { font-size: 13px; font-weight: 600; color: var(--ink-2); padding: 4px 20px 8px; }

.rv-receipt { position: relative; background: var(--card); margin: 16px 16px 20px; padding: 24px 20px; border-left: 1px solid var(--line); border-right: 1px solid var(--line); }
.rv-receipt::before, .rv-receipt::after { content: ""; position: absolute; left: -1px; right: -1px; height: 8px; pointer-events: none; }
.rv-receipt::before { top: -8px; background: radial-gradient(circle at 8px 0, transparent 5px, var(--card) 5.5px) 0 0 / 16px 8px repeat-x; }
.rv-receipt::after { bottom: -8px; background: radial-gradient(circle at 8px 8px, transparent 5px, var(--card) 5.5px) 0 0 / 16px 8px repeat-x; }
.rv-rc-head { text-align: center; }
.rv-rc-head h2 { font-size: 17px; font-weight: 700; }
.rv-rc-head p { font-size: 13px; color: var(--ink-2); margin-top: 4px; line-height: 1.4; }
.rv-rc-meta { font-size: 13px; color: var(--ink-3); margin-top: 10px; }
.rv-rc-dash { border-top: 1px dashed var(--line); margin: 16px 0; }
.rv-rc-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 6px 0; font-size: 15px; }
.rv-rc-item-main { min-width: 0; flex: 1; }
.rv-rc-usage { font-size: 13px; color: var(--ink-3); margin-top: 2px; line-height: 1.4; }
.rv-rc-item > span:last-child { color: var(--ink-2); white-space: nowrap; }
.rv-rc-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 20px; font-weight: 700; }
.rv-rc-info { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-2); margin-top: 8px; }
.rv-rc-cust .row { grid-template-columns: auto minmax(0, 1fr); cursor: default; }
.rv-rc-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 20px 16px calc(var(--sab) + 16px); }
.rv-rc-actions .btn { padding: 0 12px; width: 100%; }
`);

App.icons.rvSend = '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>';

(function () {
  const itemsText = (a) => (a.length <= 2 ? a.join(', ') : `${a.slice(0, 2).join(', ')} và ${a.length - 2} món khác`);
  const initials = (name) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

  const EXTRA_INVOICES = [
    { id: 'HD2511-081', time: '13:28', items: ['Efferalgan 500mg', 'Vitamin C 500'], total: 118000, staff: 'Ngọc Hân', pay: 'Chuyển khoản' },
    { id: 'HD2511-080', time: '13:06', items: ['Decolgen Forte', 'Strepsils'], total: 74000, staff: 'Thu Trang', pay: 'Tiền mặt' },
    { id: 'HD2511-079', time: '12:42', items: ['Panadol Extra', 'Oresol 245'], total: 68000, staff: 'Minh Tuấn', pay: 'Tiền mặt' },
    { id: 'HD2511-078', time: '12:15', items: ['Telfast HD 180', 'Nước muối sinh lý'], total: 145000, staff: 'Ngọc Hân', pay: 'Chuyển khoản' },
    { id: 'HD2511-077', time: '11:48', items: ['Smecta', 'Berberin 100mg', 'Oresol'], total: 112000, staff: 'Minh Tuấn', pay: 'Thẻ' },
    { id: 'HD2511-076', time: '11:24', items: ['Augmentin 625mg', 'Men vi sinh Enterogermina'], total: 315000, staff: 'Ngọc Hân', pay: 'Chuyển khoản' },
    { id: 'HD2511-075', time: '11:05', items: ['Berberin 100mg'], total: 48000, staff: 'Thu Trang', pay: 'Tiền mặt' },
  ];
  const ALL_INVOICES = [...DATA.invoices, ...EXTRA_INVOICES];
  const PAY_FILTERS = ['Tất cả', 'Chuyển khoản', 'Tiền mặt', 'Thẻ'];
  const USAGE_GUIDE = {
    'Panadol Extra': 'Khi đau hoặc sốt, cách 4 đến 6 giờ',
    'Berberin': 'Sáng 2, tối 2 viên, sau ăn',
    'Berberin 100mg': 'Sáng 2, tối 2 viên, sau ăn',
    'Oresol': 'Pha 1 gói với 200 ml nước',
    'Oresol 245': 'Pha 1 gói với 200 ml nước',
    'Vitamin C 500': 'Sáng 1 viên, sau ăn',
    'Augmentin 625mg': 'Sáng 1, tối 1 viên, sau ăn',
    'Telfast HD 180': 'Tối 1 viên trước khi ngủ',
    'Strepsils': 'Ngậm 1 viên khi đau họng, cách 3 giờ',
    'Smecta': 'Sáng 1, chiều 1 gói, pha với nước',
    'Men vi sinh Enterogermina': 'Sáng 1, tối 1 ống, lắc đều trước khi uống',
    'Gaviscon': 'Chiều tối 1 gói sau ăn 30 phút',
    'Efferalgan 500mg': 'Khi sốt, pha 1 viên với nước, cách 4 đến 6 giờ',
    'Decolgen Forte': 'Sáng 1, chiều 1 viên, sau ăn',
    'Nước muối sinh lý': 'Nhỏ hoặc rửa mũi 2 đến 3 lần mỗi ngày',
  };
  const usageOf = (name) => USAGE_GUIDE[name] || 'Theo chỉ dẫn của dược sĩ';
  const hourOf = (iv) => Number(String(iv.time).split(':')[0]) || 0;

  function buildReceiptLines(iv) {
    const items = iv.items || [];
    const n = items.length;
    if (!n || iv.total <= 0) return [];
    if (n === 1) return [{ name: items[0], qty: 1, unit: iv.total }];
    const unitStep = iv.total >= n * 1000 ? 1000 : 1;
    const base = Math.max(unitStep, Math.floor(iv.total / n / unitStep) * unitStep);
    let rem = iv.total;
    return items.map((name, i) => {
      if (i === n - 1) return { name, qty: 1, unit: rem };
      const lineTotal = Math.min(base, Math.max(unitStep, rem - (n - 1 - i) * unitStep));
      const qty = i === 0 && lineTotal >= 60000 && lineTotal % 2000 === 0 ? 2 : 1;
      rem -= lineTotal;
      return { name, qty, unit: lineTotal / qty };
    });
  }

  function renderPeriod(period) {
    const D = DATA, t = D.today, m = D.month;
    if (period === 'week') {
      const sum = D.week.reduce((s, d) => s + d.value, 0);
      const avg = sum / D.week.length;
      const max = Math.max(...D.week.map((d) => d.value));
      const bars = D.week.map((d, i) => {
        const h = Math.max(8, Math.round((d.value / max) * 72));
        const isNow = i === D.week.length - 1;
        return `<div class="rv-wcol" data-wi="${i}"><span class="rv-wbar${isNow ? ' now' : ''}" style="height:${h}px;animation-delay:${i * 30}ms"></span></div>`;
      }).join('');
      const axis = D.week.map((d, i) => `<span class="${i === D.week.length - 1 ? 'now' : ''}">${App.esc(d.label)}</span>`).join('');
      return {
        label: 'Doanh thu 7 ngày qua',
        total: sum,
        deltaHtml: `<div class="rv-delta neutral" data-skel>Trung bình ${App.short(avg)} mỗi ngày</div>`,
        chartHtml: `<div class="rv-wbars">${bars}</div><div class="rv-waxis">${axis}</div>`,
      };
    }
    if (period === 'month') {
      const delta = ((m.revenue - m.lastMonthSameDay) / m.lastMonthSameDay) * 100;
      const up = delta >= 0;
      const pct = Math.min(100, Math.round((m.revenue / m.target) * 100));
      const left = Math.max(0, m.target - m.revenue);
      return {
        label: `Doanh thu ${m.label.toLowerCase()}`,
        total: m.revenue,
        deltaHtml: `<div class="rv-delta ${up ? 'ok' : 'bad'}" data-skel>${App.icon(up ? 'up' : 'downRight', 16)}${up ? 'Cao hơn' : 'Thấp hơn'} cùng kỳ tháng trước ${App.pct(Math.abs(Math.round(delta * 10) / 10))}</div>`,
        chartHtml: `<div class="rv-goal">
          <div class="rv-goal-top"><span>Mục tiêu ${App.short(m.target)}</span><span class="num">${pct}%</span></div>
          <div class="rv-goal-track"><div class="rv-goal-fill" data-pct="${pct}"></div></div>
          <div class="rv-goal-sub">Còn ${App.short(left)}, 5 ngày nữa hết tháng</div>
        </div>`,
      };
    }
    const delta = ((t.revenue - t.yesterday) / t.yesterday) * 100;
    const up = delta >= 0;
    const max = Math.max(...t.hourly);
    const nowIdx = t.nowHour - t.hourStart;
    const bars = t.hourly.map((v, i) => {
      const later = i > nowIdx;
      const h = later ? 4 : Math.max(6, Math.round((v / max) * 72));
      return `<span class="rv-bar${i === nowIdx ? ' now' : ''}${later ? ' later' : ''}" style="height:${h}px;animation-delay:${i * 30}ms"></span>`;
    }).join('');
    const axis = [[1, '7h'], [6, '12h'], [11, '17h'], [16, '22h']].map(([c, l]) => `<span style="grid-column:${c}">${l}</span>`).join('');
    return {
      label: 'Doanh thu hôm nay',
      total: t.revenue,
      deltaHtml: `<div class="rv-delta ${up ? 'ok' : 'bad'}" data-skel>${App.icon(up ? 'up' : 'downRight', 16)}${up ? 'Cao hơn' : 'Thấp hơn'} hôm qua ${App.pct(Math.abs(Math.round(delta * 10) / 10))}</div>`,
      chartHtml: `<div class="rv-bars">${bars}</div><div class="rv-axis">${axis}</div>`,
    };
  }

  App.screen('revenue', {
    tab: 'revenue',
    render: (p) => {
      const period = p.period || 'today';
      const D = DATA, t = D.today;
      const view = renderPeriod(period);
      const payTotal = t.payments.reduce((s, x) => s + x.value, 0) || 1;
      const showTodayNote = period !== 'today';
      return `
        <h1 class="page-title rv-title">Doanh thu</h1>
        <div class="rv-seg-wrap">
          <div class="seg" role="tablist">
            <span class="seg-thumb"></span>
            <button class="${period === 'today' ? 'on' : ''}" data-period="today">Hôm nay</button>
            <button class="${period === 'week' ? 'on' : ''}" data-period="week">7 ngày</button>
            <button class="${period === 'month' ? 'on' : ''}" data-period="month">Tháng này</button>
          </div>
        </div>

        <div class="rv-hero">
          <div class="rv-label">${view.label}</div>
          <div class="rv-total num" data-skel><span class="rv-v">${App.num(view.total)}</span><span class="rv-cur">₫</span></div>
          <div class="rv-delta-slot">${view.deltaHtml}</div>
          <div class="rv-chart">${view.chartHtml}</div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Hình thức thanh toán</h2></div>
          <div class="card" style="margin:0 16px">
            ${t.payments.map((x) => {
              const pct = Math.round((x.value / payTotal) * 100);
              return `<div class="row rv-pay-row">
                <div class="rv-pay-head"><span>${App.esc(x.key)}</span><b class="num" data-skel>${App.money(x.value)}</b></div>
                <div class="rv-pay-track"><div class="rv-pay-fill" style="width:${pct}%"></div></div>
                <div class="rv-pay-pct" data-skel>${pct}% tổng</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Theo nhân viên</h2><span class="rv-staff-note" style="font-size:13px;color:var(--ink-3)">${showTodayNote ? 'Hôm nay' : ''}</span></div>
          <div class="card" style="margin:0 16px">
            ${t.byStaff.map((s) => `
              <div class="row" style="cursor:default">
                <div class="rv-ava">${App.esc(initials(s.name))}</div>
                <div class="row-main"><div class="row-title" data-skel>${App.esc(s.name)}</div><div class="row-sub" data-skel>${s.invoices} hóa đơn</div></div>
                <div class="row-end num" data-skel>${App.money(s.value)}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="section rv-recent">
          <div class="section-head"><h2>Hóa đơn</h2><a data-go="invoices">Xem tất cả</a></div>
          ${D.invoices.slice(0, 3).map((iv) => `
            <div class="row tap" data-go="invoiceDetail" data-p='${JSON.stringify({ id: iv.id })}'>
              <div class="rv-time num" data-skel>${iv.time}</div>
              <div class="row-main"><div class="row-title" data-skel>${App.esc(itemsText(iv.items))}</div><div class="row-sub" data-skel>${App.esc(iv.staff)}, ${App.esc(iv.pay.toLowerCase())}</div></div>
              <div class="row-end num" data-skel>${App.money(iv.total)}</div>
            </div>`).join('')}
        </div>`;
    },
    mount: (el, p) => {
      const seg = el.querySelector('.seg');
      const thumb = el.querySelector('.seg-thumb');
      const btns = [...seg.querySelectorAll('button')];
      const placeThumb = () => {
        const on = seg.querySelector('button.on');
        if (on && on.offsetWidth) {
          thumb.style.left = on.offsetLeft + 'px';
          thumb.style.width = on.offsetWidth + 'px';
        }
      };
      placeThumb();
      requestAnimationFrame(placeThumb);

      const animateChart = (period, countUp) => {
        const valEl = el.querySelector('.rv-v');
        const target = period === 'week' ? DATA.week.reduce((s, d) => s + d.value, 0) : period === 'month' ? DATA.month.revenue : DATA.today.revenue;
        if (countUp) App.countUp(valEl, target, 650);
        const bars = el.querySelector('.rv-bars, .rv-wbars');
        if (bars) { void bars.offsetWidth; bars.classList.add('grow'); }
        const fill = el.querySelector('.rv-goal-fill');
        if (fill) requestAnimationFrame(() => { fill.style.width = fill.dataset.pct + '%'; });
      };

      const clearTip = () => {
        const wbars = el.querySelector('.rv-wbars');
        if (!wbars) return;
        wbars.classList.remove('has-pick');
        wbars.querySelectorAll('.rv-wbar.picked').forEach((b) => b.classList.remove('picked'));
        wbars.querySelectorAll('.rv-tip').forEach((t) => t.remove());
      };

      const bindWeekTap = () => {
        const wbars = el.querySelector('.rv-wbars');
        if (!wbars) return;
        wbars.addEventListener('click', (e) => {
          const col = e.target.closest('.rv-wcol');
          if (!col) return;
          e.stopPropagation();
          const idx = +col.dataset.wi;
          const wasPicked = col.querySelector('.rv-wbar').classList.contains('picked');
          clearTip();
          if (wasPicked) return;
          const d = DATA.week[idx];
          wbars.classList.add('has-pick');
          col.querySelector('.rv-wbar').classList.add('picked');
          const posCls = idx === 0 ? ' left' : idx === DATA.week.length - 1 ? ' right' : '';
          const tip = document.createElement('div');
          tip.className = 'rv-tip num' + posCls;
          tip.textContent = `${d.label} ${d.date}, ${App.money(d.value)}`;
          col.appendChild(tip);
        });
      };

      el.addEventListener('click', (e) => {
        if (!e.target.closest('.rv-wcol')) clearTip();
      });

      btns.forEach((b) => b.addEventListener('click', () => {
        if (b.classList.contains('on')) return;
        btns.forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        placeThumb();
        const period = b.dataset.period;
        const view = renderPeriod(period);
        el.querySelector('.rv-label').textContent = view.label;
        el.querySelector('.rv-delta-slot').innerHTML = view.deltaHtml;
        el.querySelector('.rv-chart').innerHTML = view.chartHtml;
        el.querySelector('.rv-staff-note').textContent = period !== 'today' ? 'Hôm nay' : '';
        animateChart(period, true);
        bindWeekTap();
      }));

      bindWeekTap();
      const initPeriod = p.period || 'today';
      App.load(el, 'revenue').then((first) => {
        placeThumb();
        animateChart(initPeriod, first);
      });
    },
  });

  App.screen('invoices', {
    render: (p) => {
      const q = p.q || '';
      return `
        ${App.header({ title: 'Hóa đơn hôm nay' })}
        <div class="rv-inv-summary">
          <div>
            <div class="rv-inv-sum-val num">${DATA.today.invoices} hóa đơn</div>
            <div class="rv-inv-sum-sub">hôm nay</div>
          </div>
          <div class="rv-inv-sum-right">
            <div class="rv-inv-sum-val num">${App.money(DATA.today.revenue)}</div>
            <div class="rv-inv-sum-sub">tổng tiền</div>
          </div>
        </div>
        <div class="rv-search-wrap">
          <div class="rv-search">
            ${App.icon('search', 18)}
            <input type="search" placeholder="Tìm theo mã hoặc tên thuốc" value="${App.esc(q)}">
          </div>
        </div>
        <div class="rv-chips" role="tablist" aria-label="Lọc theo hình thức thanh toán">
          ${PAY_FILTERS.map((f, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-pay="${App.esc(f)}" aria-pressed="${i === 0}">${App.esc(f)}</button>`).join('')}
        </div>
        <div class="rv-inv-list"></div>`;
    },
    mount: (el, p) => {
      const input = el.querySelector('input');
      const chips = [...el.querySelectorAll('.rv-chips .chip')];
      const list = el.querySelector('.rv-inv-list');
      let activePay = 'Tất cả';
      const renderGroup = (label, rows, last) => `
        <div class="rv-inv-group">${label}</div>
        <div class="card rv-recent" style="margin:0 16px ${last ? 24 : 16}px">${rows.map((iv) => `
          <div class="row tap" data-go="invoiceDetail" data-p='${JSON.stringify({ id: iv.id })}'>
            <div class="rv-time num">${iv.time}</div>
            <div class="row-main"><div class="row-title">${App.esc(itemsText(iv.items))}</div><div class="row-sub">${App.esc(iv.staff)}, ${App.esc(iv.pay.toLowerCase())}</div></div>
            <div class="row-end num">${App.money(iv.total)}</div>
          </div>`).join('')}</div>`;
      const draw = (q) => {
        const kw = q.trim().toLowerCase();
        const rows = ALL_INVOICES.filter((iv) => {
          const matchPay = activePay === 'Tất cả' || iv.pay === activePay;
          const matchKw = !kw || iv.id.toLowerCase().includes(kw) || iv.items.some((m) => m.toLowerCase().includes(kw));
          return matchPay && matchKw;
        });
        if (!rows.length) {
          const msg = kw
            ? `Không thấy hóa đơn khớp với "${App.esc(q.trim())}".`
            : `Không có hóa đơn thanh toán bằng ${App.esc(activePay.toLowerCase())}.`;
          list.innerHTML = `<div class="empty"><div class="tile">${App.icon('search', 26)}</div>${msg}</div>`;
          return;
        }
        const afternoon = rows.filter((iv) => hourOf(iv) >= 13);
        const morning = rows.filter((iv) => hourOf(iv) < 13);
        const groups = [];
        if (afternoon.length) groups.push(['Chiều', afternoon]);
        if (morning.length) groups.push(['Sáng', morning]);
        list.innerHTML = groups.map(([label, grp], idx) => renderGroup(label, grp, idx === groups.length - 1)).join('');
      };
      draw(p.q || '');
      input.addEventListener('input', () => draw(input.value));
      chips.forEach((chip) => chip.addEventListener('click', () => {
        activePay = chip.dataset.pay;
        chips.forEach((c) => {
          const on = c === chip;
          c.classList.toggle('on', on);
          c.setAttribute('aria-pressed', String(on));
        });
        draw(input.value);
      }));
    },
  });

  App.screen('invoiceDetail', {
    render: (p) => {
      const iv = ALL_INVOICES.find((x) => x.id === p.id);
      if (!iv) {
        return `${App.header({ title: 'Chi tiết hóa đơn' })}
          <div class="empty"><div class="tile">${App.icon('receipt', 28)}</div>Không tìm thấy hóa đơn này.</div>`;
      }
      const lines = buildReceiptLines(iv);
      const customer = iv.id === 'HD2511-085'
        ? { title: 'Chị Lan', sub: '0912 *** 208, mua lần thứ 6' }
        : { title: 'Khách lẻ', sub: 'Không lưu thông tin khách' };
      return `
        ${App.header({ title: iv.id })}
        <div class="rv-receipt">
          <div class="rv-rc-head">
            <h2>${App.esc(DATA.store.name)}</h2>
            <p>${App.esc(DATA.store.address)}</p>
            <div class="rv-rc-meta num">${App.esc(iv.id)}, ${App.esc(iv.time)}</div>
          </div>
          <div class="rv-rc-dash"></div>
          ${lines.map((l) => `
            <div class="rv-rc-item">
              <div class="rv-rc-item-main">
                <div>${App.esc(l.name)}</div>
                <div class="rv-rc-usage">${App.esc(usageOf(l.name))}</div>
              </div>
              <span class="num">${l.qty} x ${App.money(l.unit)}</span>
            </div>`).join('')}
          <div class="rv-rc-dash"></div>
          <div class="rv-rc-total">
            <span>Tổng cộng</span>
            <span class="num">${App.money(iv.total)}</span>
          </div>
          <div class="rv-rc-info"><span>Thanh toán</span><span>${App.esc(iv.pay)}</span></div>
          <div class="rv-rc-info"><span>Người bán</span><span>${App.esc(iv.staff)}</span></div>
        </div>
        <div class="section rv-rc-cust">
          <div class="section-head"><h2>Khách hàng</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row">
              <div class="tile">${App.icon('user', 20)}</div>
              <div class="row-main">
                <div class="row-title">${App.esc(customer.title)}</div>
                <div class="row-sub">${App.esc(customer.sub)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="rv-rc-actions">
          <button class="btn btn-secondary tap" data-print>${App.icon('printer', 20)}In lại</button>
          <button class="btn btn-secondary tap" data-zalo>${App.icon('rvSend', 20)}Gửi Zalo</button>
        </div>`;
    },
    mount: (el) => {
      const printBtn = el.querySelector('[data-print]');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          const done = App.busy(printBtn, 'Đang gửi tới máy in...');
          setTimeout(() => { done(); App.toast('Đã in hóa đơn', 'printer'); }, 1000);
        });
      }
      const zaloBtn = el.querySelector('[data-zalo]');
      if (zaloBtn) {
        zaloBtn.addEventListener('click', () => {
          const done = App.busy(zaloBtn, 'Đang gửi...');
          setTimeout(() => { done(); App.toast('Đã gửi hóa đơn qua Zalo'); }, 900);
        });
      }
    },
  });

  App.state('Doanh thu hôm nay', () => App.reset('revenue', { period: 'today' }), 'Doanh thu');
  App.state('Doanh thu 7 ngày', () => App.reset('revenue', { period: 'week' }), 'Doanh thu');
  App.state('Doanh thu tháng', () => App.reset('revenue', { period: 'month' }), 'Doanh thu');
  App.state('Hóa đơn hôm nay', () => { App.reset('revenue'); App.go('invoices'); }, 'Doanh thu');
  App.state('Hóa đơn: không tìm thấy', () => { App.reset('revenue'); App.go('invoices', { q: 'xyz' }); }, 'Doanh thu');
  App.state('Chi tiết hóa đơn', () => { App.reset('revenue'); App.go('invoices'); App.go('invoiceDetail', { id: DATA.invoices[0].id }); }, 'Doanh thu');
})();
