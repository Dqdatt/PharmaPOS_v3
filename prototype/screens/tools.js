/* Tiện ích + các màn kho: tools (tab), lowStock, expiring, payables, shifts, stockSearch */
App.css(`
.tl-title { padding-top: calc(var(--sat) + 12px); }
.tl-fake-search { margin: 0 16px 16px; height: 46px; padding: 0 14px; border-radius: 14px; background: var(--card); border: 1px solid var(--line);
  display: flex; align-items: center; gap: 10px; color: var(--ink-3); font-size: 15px; cursor: pointer; }
.tl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 16px; }
.tl-stat { padding: 16px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
.tl-stat-num { font-size: 32px; font-weight: 800; line-height: 1.1; margin-top: 2px; }
.tl-stat-lbl { font-size: 15px; font-weight: 600; color: var(--ink); }
.tl-stat-sub { font-size: 13px; color: var(--ink-3); margin-top: 2px; }

.tl-ls-row { display: block; padding: 14px 16px; cursor: default; }
.tl-ls-row + .tl-ls-row::before { left: 16px; }
.tl-ls-track { height: 6px; border-radius: 3px; background: var(--soft); overflow: hidden; margin-top: 10px; }
.tl-ls-fill { height: 100%; border-radius: 3px; background: var(--warn); }
.tl-ls-fill.bad { background: var(--bad); }
.tl-ls-wrap { min-height: calc(100% - var(--sat) - 56px); display: flex; flex-direction: column; }
.tl-ls-list { margin-bottom: auto; }
.tl-float-bar { position: sticky; bottom: max(8px, calc(var(--sab) - 18px)); margin: 16px 8px 8px; padding: 10px; border-radius: 28px; z-index: 15; }

.tl-exp-hero { padding: 12px 20px 0; font-size: 13px; color: var(--ink-2); }
.tl-exp-total { margin: 4px 0; font-size: 28px; font-weight: 700; color: var(--ink); }
.tl-bottom { padding-bottom: var(--sab); }
.tl-pay-hero { padding: 12px 20px 20px; }
.tl-pay-lbl { font-size: 14px; color: var(--ink-2); }
.tl-pay-total { font-size: 34px; font-weight: 800; margin-top: 4px; }
.tl-pay-current { display: flow-root; min-height: 192px; }
.tl-paid-list .row { min-height: 90px; }
.tl-paid-list .row-end { color: var(--ink-2); }

.tl-ava { width: 36px; height: 36px; border-radius: 18px; background: var(--teal-50); color: var(--teal-700);
  display: grid; place-items: center; font-size: 13px; font-weight: 700; }
.tl-status-ok { font-size: 14px; font-weight: 600; color: var(--ok); }
.tl-status-muted { font-size: 14px; font-weight: 500; color: var(--ink-2); }
.tl-shift-time { position: relative; margin: 16px 24px 20px; height: 56px; font-size: 12px; }
.tl-shift-bars { position: absolute; inset: 23px 0 auto; display: grid; grid-template-columns: 7fr 8fr; }
.tl-shift-bars span { height: 10px; border-radius: 5px; background: var(--teal-200); margin-right: 2px; }
.tl-shift-bars span + span { background: var(--teal-600); margin: 0 0 0 2px; }
.tl-shift-now { position: absolute; left: 50.6667%; top: 0; color: var(--ink); transform: translateX(-50%); white-space: nowrap; }
.tl-shift-now::after { content: ""; position: absolute; width: 1px; height: 20px; background: currentColor; left: 50%; top: 18px; }
.tl-shift-axis { position: absolute; inset: auto -8px 0; display: flex; justify-content: space-between; color: var(--ink-3); }
.tl-shift-staff .row { min-height: 92px; }
.tl-shift-revenue .row { min-height: 96px; }
.tl-text-row { grid-template-columns: 1fr auto; cursor: default; }
.tl-text-row + .tl-text-row::before { left: 16px; }

.tl-search-nav { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 10px;
  padding: calc(var(--sat) + 4px) 16px 10px; transition: background .25s var(--ease), box-shadow .25s var(--ease); }
.tl-search-nav.scrolled { background: var(--glass-strong); backdrop-filter: var(--gl-blur); -webkit-backdrop-filter: var(--gl-blur); box-shadow: 0 1px 0 var(--line); }
.tl-search-box { flex: 1; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.tl-search-box .ic { color: var(--ink-3); }
.tl-search-box input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ink); outline: none; }
.tl-search-box input::placeholder { color: var(--ink-3); }
.tl-best-list .row { min-height: 68px; cursor: default; }
.tl-rank { width: 24px; font-size: 14px; font-weight: 700; color: var(--ink-3); }
.tl-best-list .row + .row::before { left: 52px; }
.tl-sheet-meta { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.tl-sheet-line { display: flex; justify-content: space-between; font-size: 15px; color: var(--ink-2); }
.tl-sheet-line b { color: var(--ink); font-weight: 600; }
.tl-sheet-tip { margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: var(--warn-soft); color: var(--warn); font-size: 14px; line-height: 1.45; }
.tl-sheet-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
`);

(function () {
  const RECENT_SEARCH = ['Panadol Extra', 'Augmentin 625mg', 'Oresol 245'];
  const EXPIRING_VALUES = { L2304: 1470000, SM118: 112000, DC072: 126000 };
  const LATER_EXPIRING = [
    { name: 'Hapacol 250', lot: 'HP2506', exp: '30/12/2026', days: 35, qty: '12 hộp', value: 480000 },
    { name: 'Vitamin C 500 DHG', lot: 'VC510', exp: '12/01/2027', days: 48, qty: '10 lọ', value: 620000 },
    { name: 'Gaviscon', lot: 'GV126', exp: '27/01/2027', days: 63, qty: '8 hộp', value: 768000 },
    { name: 'Strepsils', lot: 'ST246', exp: '16/02/2027', days: 83, qty: '15 vỉ', value: 525000 },
  ];
  const EXPIRING = [
    ...DATA.expiring.map((x) => ({ ...x, value: EXPIRING_VALUES[x.lot] || 0 })),
    ...LATER_EXPIRING,
  ].sort((a, b) => a.days - b.days);
  const RECENT_PAID = [
    { supplier: 'Dược Hậu Giang', amount: 6850000, date: '20/11', method: 'chuyển khoản' },
    { supplier: 'Dược Phúc Long', amount: 3200000, date: '20/11', method: 'chuyển khoản' },
    { supplier: 'Zuellig Pharma', amount: 12400000, date: '20/11', method: 'chuyển khoản' },
    { supplier: 'Dược Tâm Đức', amount: 1980000, date: '20/11', method: 'chuyển khoản' },
  ];
  const PAYMENT_DATE = '25/11';
  const SHIFT_REVENUE = [
    { title: 'Ca sáng, đã xong', amount: 9860000, detail: '58 hóa đơn, Ngọc Hân và Minh Tuấn' },
    { title: 'Ca chiều, đang chạy', amount: 2620000, detail: '28 hóa đơn, Thu Trang' },
  ];
  const BEST_SELLERS = [
    { name: 'Panadol Extra', sold: 18, left: 3, unit: 'hộp', revenue: 1260000 },
    { name: 'Oresol 245', sold: 16, left: 12, unit: 'gói', revenue: 64000 },
    { name: 'Smecta', sold: 15, left: 14, unit: 'gói', revenue: 120000 },
    { name: 'Decolgen Forte', sold: 12, left: 9, unit: 'vỉ', revenue: 168000 },
    { name: 'Augmentin 625mg', sold: 10, left: 6, unit: 'hộp', revenue: 2450000 },
  ];
  const initials = (name) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  let payablesState = null;
  const paidToday = [];
  const getPayables = () => (payablesState || (payablesState = DATA.payables.map((x) => ({ ...x }))));

  function buildCatalog() {
    const map = new Map();
    DATA.lowStock.forEach((x) => map.set(x.name, { name: x.name, stock: `Còn ${x.left} ${x.unit}`, lot: '' }));
    EXPIRING.forEach((x) => {
      const cur = map.get(x.name);
      map.set(x.name, { name: x.name, stock: cur ? cur.stock : `Còn ${x.qty}`, lot: x.lot });
    });
    DATA.invoices.forEach((iv) => iv.items.forEach((name) => {
      if (!map.has(name)) map.set(name, { name, stock: 'Còn 40 hộp', lot: '' });
    }));
    return [...map.values()];
  }

  App.screen('tools', {
    tab: 'tools',
    render: () => {
      const D = DATA;
      const totalPay = getPayables().reduce((s, x) => s + x.amount, 0);
      return `
        <h1 class="page-title tl-title">Tiện ích</h1>
        <div class="tl-fake-search tap" data-go="stockSearch">
          ${App.icon('search', 18)}
          <span>Tìm thuốc, số lô</span>
        </div>

        <div class="tl-grid">
          <div class="card tl-stat tap" data-go="lowStock">
            <div class="tile warn">${App.icon('box', 20)}</div>
            <div>
              <div class="tl-stat-num num">${D.lowStock.length}</div>
              <div class="tl-stat-lbl">Sắp hết hàng</div>
              <div class="tl-stat-sub">thuốc cần nhập</div>
            </div>
          </div>
          <div class="card tl-stat tap" data-go="expiring">
            <div class="tile warn">${App.icon('clock', 20)}</div>
            <div>
              <div class="tl-stat-num num">${D.expiring.length}</div>
              <div class="tl-stat-lbl">Cận hạn</div>
              <div class="tl-stat-sub">lô trong 30 ngày</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Bán hàng</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" data-go="invoices">
              <div class="tile">${App.icon('receipt', 20)}</div>
              <div class="row-main"><div class="row-title">Hóa đơn hôm nay</div></div>
              <div class="row-end num">${D.today.invoices}${App.icon('chev', 18)}</div>
            </div>
            <div class="row tap" data-go="payables">
              <div class="tile">${App.icon('wallet', 20)}</div>
              <div class="row-main"><div class="row-title">Công nợ</div></div>
              <div class="row-end num">${App.money(totalPay)}${App.icon('chev', 18)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Nhân viên</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" data-go="shifts">
              <div class="tile">${App.icon('users', 20)}</div>
              <div class="row-main"><div class="row-title">Ca làm hôm nay</div></div>
              <div class="row-end">${D.shifts.length} người${App.icon('chev', 18)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Cửa hàng</h2></div>
          <div class="card" style="margin:0 16px">
            <div class="row tap" data-web-toast="Dùng trên web, mục In tem" data-web-icon="printer">
              <div class="tile">${App.icon('printer', 20)}</div>
              <div class="row-main"><div class="row-title">In tem A6</div></div>
              <div class="row-end">${App.icon('chev', 18)}</div>
            </div>
            <div class="row tap" data-web-toast="Dùng trên web, mục Thiết bị" data-web-icon="sliders">
              <div class="tile">${App.icon('sliders', 20)}</div>
              <div class="row-main"><div class="row-title">Máy in và máy quét</div></div>
              <div class="row-end">${App.icon('chev', 18)}</div>
            </div>
          </div>
        </div>`;
    },
    mount: (el) => {
      el.querySelectorAll('[data-web-toast]').forEach((row) => {
        row.addEventListener('click', () => App.toast(row.dataset.webToast, row.dataset.webIcon || 'info'));
      });
    },
  });

  App.screen('lowStock', {
    render: () => {
      const items = DATA.lowStock;
      return `
        ${App.header({ title: 'Sắp hết hàng' })}
        <div class="tl-ls-wrap">
          <div class="card tl-ls-list" style="margin:8px 16px auto">
            ${items.map((x) => {
              const ratio = Math.min(1, x.left / x.min);
              const pct = Math.max(6, Math.round(ratio * 100));
              return `<div class="row tl-ls-row">
                <div class="row-title">${App.esc(x.name)}</div>
                <div class="row-sub">Còn ${x.left} ${App.esc(x.unit)}, tối thiểu ${x.min}</div>
                <div class="tl-ls-track"><div class="tl-ls-fill${ratio <= 0.25 ? ' bad' : ''}" style="width:${pct}%"></div></div>
              </div>`;
            }).join('')}
          </div>
          <div class="tl-float-bar glass-strong">
            <button class="btn btn-primary block tap" data-create-po>Tạo phiếu nhập ${items.length} thuốc</button>
          </div>
        </div>`;
    },
    mount: (el) => {
      const btn = el.querySelector('[data-create-po]');
      btn.addEventListener('click', () => {
        const done = App.busy(btn, 'Đang tạo phiếu...');
        setTimeout(() => { done(); App.toast('Đã tạo phiếu nháp, hoàn tất trên web', 'check'); }, 900);
      });
    },
  });

  App.screen('expiring', {
    render: () => {
      const soonCount = EXPIRING.filter((x) => x.days <= 30).length;
      const total = EXPIRING.reduce((sum, x) => sum + x.value, 0);
      const rows = EXPIRING.map((x, i) => {
        const tone = x.days <= 7 ? ' bad' : x.days <= 30 ? ' warn' : '';
        return `
          <div class="row tap" data-exp-i="${i}">
            <div class="tile${tone}">${App.icon('clock', 20)}</div>
            <div class="row-main">
              <div class="row-title">${App.esc(x.name)}</div>
              <div class="row-sub">Lô ${App.esc(x.lot)}, ${App.esc(x.qty)}</div>
            </div>
            <div class="row-end"><span class="chip${tone}">${x.days} ngày</span></div>
          </div>`;
      });
      return `
        ${App.header({ title: 'Hàng cận hạn' })}
        <div class="tl-exp-hero">
          <div>Giá trị hàng cận hạn</div>
          <div class="tl-exp-total num">${App.money(total)}</div>
          <div>${soonCount} lô trong 30 ngày, ${EXPIRING.length - soonCount} lô từ 31 đến 90 ngày</div>
        </div>
        <div class="section">
          <div class="section-head"><h2>Trong 30 ngày</h2></div>
          <div class="card" style="margin:0 16px">${rows.slice(0, soonCount).join('')}</div>
        </div>
        <div class="section">
          <div class="section-head"><h2>Từ 31 đến 90 ngày</h2></div>
          <div class="card" style="margin:0 16px">${rows.slice(soonCount).join('')}</div>
        </div>
        <div class="tl-bottom" style="margin:20px 16px 0">
          <button class="btn btn-secondary block tap" data-export-exp>Xuất danh sách cho nhà cung cấp</button>
        </div>`;
    },
    mount: (el) => {
      const btn = el.querySelector('[data-export-exp]');
      btn.addEventListener('click', () => {
        const done = App.busy(btn, 'Đang tạo danh sách...');
        setTimeout(() => { done(); App.toast('Đã tạo danh sách, mở trên web để in', 'check'); }, 800);
      });
      el.querySelectorAll('[data-exp-i]').forEach((row) => {
        row.addEventListener('click', () => {
          const x = EXPIRING[+row.dataset.expI];
          App.sheet(`
            <h3>${App.esc(x.name)}</h3>
            <div class="tl-sheet-meta">
              <div class="tl-sheet-line"><span>Số lô</span><b>${App.esc(x.lot)}</b></div>
              <div class="tl-sheet-line"><span>Hạn dùng</span><b>${App.esc(x.exp)} (còn ${x.days} ngày)</b></div>
              <div class="tl-sheet-line"><span>Số lượng</span><b>${App.esc(x.qty)}</b></div>
            </div>
            <div class="tl-sheet-tip">Ưu tiên bán trước hoặc trả nhà cung cấp.</div>
            <button class="btn btn-secondary block tap" style="margin-top:20px" data-close>Đóng</button>
          `);
        });
      });
    },
  });

  function renderPayablesBody(list) {
    const total = list.reduce((s, x) => s + x.amount, 0);
    if (!list.length) {
      return `<div class="empty"><div class="tile">${App.icon('wallet', 28)}</div>Không còn công nợ.</div>`;
    }
    return `
      <div class="tl-pay-hero">
        <div class="tl-pay-lbl">Tổng công nợ</div>
        <div class="tl-pay-total num">${App.money(total)}</div>
      </div>
      <div class="card" style="margin:0 16px 24px">
        ${list.map((x, i) => `
          <div class="row tap" data-pay-i="${i}">
            <div class="tile">${App.icon('wallet', 20)}</div>
            <div class="row-main">
              <div class="row-title ell">${App.esc(x.supplier)}</div>
              <div class="row-sub">Hạn trả ${App.esc(x.due)}</div>
            </div>
            <div class="row-end num">${App.money(x.amount)}</div>
          </div>`).join('')}
      </div>`;
  }

  App.screen('payables', {
    render: () => `
      ${App.header({ title: 'Công nợ nhà cung cấp' })}
      <div class="tl-pay-current">${renderPayablesBody(getPayables())}</div>
      <div class="section tl-bottom">
        <div class="section-head"><h2>Đã trả gần đây</h2></div>
        <div class="card tl-paid-list" style="margin:0 16px">
          ${[...paidToday, ...RECENT_PAID].map(renderPaidRow).join('')}
        </div>
      </div>`,
    mount: (el) => {
      const bindRows = () => {
        const list = getPayables();
        el.querySelectorAll('[data-pay-i]').forEach((row) => {
          row.addEventListener('click', () => {
            const idx = +row.dataset.payI;
            const item = list[idx];
            App.sheet(`
              <h3>${App.esc(item.supplier)}</h3>
              <div class="tl-sheet-meta">
                <div class="tl-sheet-line"><span>Số tiền</span><b class="num">${App.money(item.amount)}</b></div>
                <div class="tl-sheet-line"><span>Hạn trả</span><b>${App.esc(item.due)}</b></div>
              </div>
              <button class="btn btn-primary block tap" style="margin-top:20px" data-mark-paid>Đánh dấu đã trả</button>
            `, {
              onMount: (sheetEl, close) => {
                sheetEl.querySelector('[data-mark-paid]').addEventListener('click', () => {
                  close();
                  App.sheet(`
                    <h3>Xác nhận thanh toán</h3>
                    <p>Đánh dấu đã trả ${App.money(item.amount)} cho ${App.esc(item.supplier)}?</p>
                    <div class="tl-sheet-actions">
                      <button class="btn btn-secondary tap" data-close>Hủy</button>
                      <button class="btn btn-primary tap" data-confirm-paid>Đã trả</button>
                    </div>
                  `, {
                    onMount: (confirmEl, closeConfirm) => {
                      const cBtn = confirmEl.querySelector('[data-confirm-paid]');
                      cBtn.addEventListener('click', () => {
                        const done = App.busy(cBtn, 'Đang ghi nhận...');
                        setTimeout(() => {
                          done();
                          closeConfirm();
                          const index = list.indexOf(item);
                          if (list !== payablesState || index < 0) return;
                          list.splice(index, 1);
                          const paid = { ...item, date: PAYMENT_DATE };
                          paidToday.unshift(paid);
                          App.toast('Đã ghi nhận thanh toán', 'check');
                          el.querySelector('.tl-pay-current').innerHTML = renderPayablesBody(list);
                          el.querySelector('.tl-paid-list').insertAdjacentHTML('afterbegin', renderPaidRow(paid));
                          bindRows();
                        }, 700);
                      });
                    },
                  });
                });
              },
            });
          });
        });
      };
      bindRows();
    },
  });

  function renderPaidRow(x) {
    return `<div class="row tl-text-row">
      <div class="row-main">
        <div class="row-title">${App.esc(x.supplier)}</div>
        <div class="row-sub">Trả ngày ${App.esc(x.date)}${x.method ? `, ${App.esc(x.method)}` : ''}</div>
      </div>
      <div class="row-end num">${App.money(x.amount)}</div>
    </div>`;
  }

  App.screen('shifts', {
    render: () => `
      ${App.header({ title: 'Ca làm hôm nay' })}
      <div class="tl-shift-time">
        <div class="tl-shift-bars" role="img" aria-label="Ca sáng 7:00 đến 14:00, đã xong. Ca chiều 14:00 đến 22:00, đang chạy"><span></span><span></span></div>
        <div class="tl-shift-now num">Bây giờ 14:36</div>
        <div class="tl-shift-axis num"><span>7h</span><span>12h</span><span>17h</span><span>22h</span></div>
      </div>
      <div class="card tl-shift-staff" style="margin:8px 16px 24px">
        ${DATA.shifts.map((s) => {
          const working = s.status === 'Đang làm';
          return `<div class="row" style="cursor:default">
            <div class="tl-ava">${App.esc(initials(s.name))}</div>
            <div class="row-main">
              <div class="row-title">${App.esc(s.name)}</div>
              <div class="row-sub">${App.esc(s.shift)}</div>
            </div>
            <div class="row-end ${working ? 'tl-status-ok' : 'tl-status-muted'}">${App.esc(s.status)}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="section tl-bottom">
        <div class="section-head"><h2>Doanh thu theo ca</h2></div>
        <div class="card tl-shift-revenue" style="margin:0 16px">
          ${SHIFT_REVENUE.map((x) => `<div class="row tl-text-row">
            <div class="row-main">
              <div class="row-title">${App.esc(x.title)}</div>
              <div class="row-sub">${App.esc(x.detail)}</div>
            </div>
            <div class="row-end num">${App.money(x.amount)}</div>
          </div>`).join('')}
        </div>
      </div>`,
  });

  App.screen('stockSearch', {
    render: () => `
      <header class="tl-search-nav" data-nav>
        <button class="nav-btn glass tap" data-back aria-label="Quay lại">${App.icon('back', 22)}</button>
        <div class="tl-search-box">
          ${App.icon('search', 18)}
          <input type="search" placeholder="Tìm thuốc, số lô" autofocus>
        </div>
      </header>
      <div class="tl-search-results"></div>`,
    mount: (el, p) => {
      const catalog = buildCatalog();
      const input = el.querySelector('input');
      const box = el.querySelector('.tl-search-results');
      const draw = (q) => {
        const kw = q.trim().toLowerCase();
        if (!kw) {
          box.innerHTML = `
            <div class="section" style="margin-top:12px">
              <div class="section-head"><h2>Tìm gần đây</h2></div>
              <div class="card" style="margin:0 16px">
                ${RECENT_SEARCH.map((name) => `
                  <div class="row tap" data-pick="${App.esc(name)}">
                    <div class="tile">${App.icon('clock', 18)}</div>
                    <div class="row-main"><div class="row-title">${App.esc(name)}</div></div>
                    <div class="row-end">${App.icon('chev', 18)}</div>
                  </div>`).join('')}
              </div>
            </div>
            <div class="section tl-bottom">
              <div class="section-head"><h2>Bán chạy hôm nay</h2></div>
              <div class="card tl-best-list" style="margin:0 16px">
                ${BEST_SELLERS.map((x, i) => `<div class="row">
                  <div class="tl-rank num">${i + 1}</div>
                  <div class="row-main">
                    <div class="row-title">${App.esc(x.name)}</div>
                    <div class="row-sub">Đã bán ${x.sold} ${App.esc(x.unit)}, còn ${x.left}</div>
                  </div>
                  <div class="row-end num">${App.money(x.revenue)}</div>
                </div>`).join('')}
              </div>
            </div>`;
          box.querySelectorAll('[data-pick]').forEach((r) => r.addEventListener('click', () => {
            input.value = r.dataset.pick;
            draw(input.value);
          }));
          return;
        }
        const hits = catalog.filter((x) => x.name.toLowerCase().includes(kw) || (x.lot && x.lot.toLowerCase().includes(kw)));
        if (!hits.length) {
          box.innerHTML = `<div class="empty"><div class="tile">${App.icon('search', 26)}</div>Không thấy thuốc khớp với "${App.esc(q.trim())}".</div>`;
          return;
        }
        box.innerHTML = `<div class="card" style="margin:8px 16px 24px">${hits.map((x) => `
          <div class="row" style="cursor:default">
            <div class="tile">${App.icon('pill', 20)}</div>
            <div class="row-main">
              <div class="row-title">${App.esc(x.name)}</div>
              ${x.lot ? `<div class="row-sub">Lô ${App.esc(x.lot)}</div>` : ''}
            </div>
            <div class="row-end">${App.esc(x.stock)}</div>
          </div>`).join('')}</div>`;
      };
      input.value = typeof p.query === 'string' ? p.query : '';
      draw(input.value);
      input.addEventListener('input', () => draw(input.value));
      setTimeout(() => input.focus(), 120);
    },
  });

  App.state('Tiện ích', () => App.reset('tools'), 'Tiện ích');
  App.state('Sắp hết hàng', () => { App.reset('tools'); App.go('lowStock'); }, 'Tiện ích');
  App.state('Hàng cận hạn', () => { App.reset('tools'); App.go('expiring'); }, 'Tiện ích');
  App.state('Hàng cận hạn: chi tiết lô', () => {
    App.reset('tools');
    App.go('expiring');
    App.current().el.querySelector('[data-exp-i]').click();
  }, 'Tiện ích');
  App.state('Công nợ', () => { payablesState = null; paidToday.length = 0; App.reset('tools'); App.go('payables'); }, 'Tiện ích');
  App.state('Công nợ: đã trả hết', () => {
    payablesState = [];
    paidToday.splice(0, paidToday.length, ...DATA.payables.map((x) => ({ ...x, date: PAYMENT_DATE })));
    App.reset('tools');
    App.go('payables');
  }, 'Tiện ích');
  App.state('Ca làm', () => { App.reset('tools'); App.go('shifts'); }, 'Tiện ích');
  App.state('Tìm thuốc', () => { App.reset('tools'); App.go('stockSearch'); }, 'Tiện ích');
  App.state('Tìm thuốc: có kết quả', () => { App.reset('tools'); App.go('stockSearch', { query: 'SM118' }); }, 'Tiện ích');
  App.state('Tìm thuốc: không có kết quả', () => { App.reset('tools'); App.go('stockSearch', { query: 'XYZ' }); }, 'Tiện ích');
})();
