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

.tl-pay-hero { padding: 12px 20px 20px; }
.tl-pay-lbl { font-size: 14px; color: var(--ink-2); }
.tl-pay-total { font-size: 34px; font-weight: 800; margin-top: 4px; }

.tl-ava { width: 36px; height: 36px; border-radius: 18px; background: var(--teal-50); color: var(--teal-700);
  display: grid; place-items: center; font-size: 13px; font-weight: 700; }
.tl-status-ok { font-size: 14px; font-weight: 600; color: var(--ok); }
.tl-status-muted { font-size: 14px; font-weight: 500; color: var(--ink-2); }

.tl-search-nav { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 10px;
  padding: calc(var(--sat) + 4px) 16px 10px; background: var(--page); }
.tl-search-box { flex: 1; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 14px;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.tl-search-box .ic { color: var(--ink-3); }
.tl-search-box input { flex: 1; min-width: 0; border: 0; background: none; font: inherit; font-size: 15px; color: var(--ink); outline: none; }
.tl-search-box input::placeholder { color: var(--ink-3); }
.tl-sheet-meta { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.tl-sheet-line { display: flex; justify-content: space-between; font-size: 15px; color: var(--ink-2); }
.tl-sheet-line b { color: var(--ink); font-weight: 600; }
.tl-sheet-tip { margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: var(--warn-soft); color: var(--warn); font-size: 14px; line-height: 1.45; }
.tl-sheet-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
`);

(function () {
  const RECENT_SEARCH = ['Panadol Extra', 'Augmentin 625mg', 'Oresol 245'];
  const initials = (name) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
  let payablesState = null;
  const getPayables = () => (payablesState || (payablesState = DATA.payables.map((x) => ({ ...x }))));

  function buildCatalog() {
    const map = new Map();
    DATA.lowStock.forEach((x) => map.set(x.name, { name: x.name, stock: `Còn ${x.left} ${x.unit}`, lot: '' }));
    DATA.expiring.forEach((x) => {
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
      const sorted = [...DATA.expiring].sort((a, b) => a.days - b.days);
      return `
        ${App.header({ title: 'Hàng cận hạn' })}
        <div class="card" style="margin:8px 16px 24px">
          ${sorted.map((x, i) => `
            <div class="row tap" data-exp-i="${i}">
              <div class="tile ${x.days <= 7 ? 'bad' : 'warn'}">${App.icon('clock', 20)}</div>
              <div class="row-main">
                <div class="row-title">${App.esc(x.name)}</div>
                <div class="row-sub">Lô ${App.esc(x.lot)}, ${App.esc(x.qty)}</div>
              </div>
              <div class="row-end"><span class="chip ${x.days <= 7 ? 'bad' : 'warn'}">${x.days} ngày</span></div>
            </div>`).join('')}
        </div>`;
    },
    mount: (el) => {
      const sorted = [...DATA.expiring].sort((a, b) => a.days - b.days);
      el.querySelectorAll('[data-exp-i]').forEach((row) => {
        row.addEventListener('click', () => {
          const x = sorted[+row.dataset.expI];
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
      <div class="tl-pay-body">${renderPayablesBody(getPayables())}</div>`,
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
                          list.splice(idx, 1);
                          closeConfirm();
                          App.toast('Đã ghi nhận thanh toán', 'check');
                          el.querySelector('.tl-pay-body').innerHTML = renderPayablesBody(list);
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

  App.screen('shifts', {
    render: () => `
      ${App.header({ title: 'Ca làm hôm nay' })}
      <div class="card" style="margin:8px 16px 24px">
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
      </div>`,
  });

  App.screen('stockSearch', {
    render: () => `
      <header class="tl-search-nav">
        <button class="nav-btn glass tap" data-back aria-label="Quay lại">${App.icon('back', 22)}</button>
        <div class="tl-search-box">
          ${App.icon('search', 18)}
          <input type="search" placeholder="Tìm thuốc, số lô" autofocus>
        </div>
      </header>
      <div class="tl-search-results"></div>`,
    mount: (el) => {
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
      draw('');
      input.addEventListener('input', () => draw(input.value));
      setTimeout(() => input.focus(), 120);
    },
  });

  App.state('Tiện ích', () => App.reset('tools'), 'Tiện ích');
  App.state('Sắp hết hàng', () => { App.reset('tools'); App.go('lowStock'); }, 'Tiện ích');
  App.state('Hàng cận hạn', () => { App.reset('tools'); App.go('expiring'); }, 'Tiện ích');
  App.state('Công nợ', () => { payablesState = null; App.reset('tools'); App.go('payables'); }, 'Tiện ích');
  App.state('Ca làm', () => { App.reset('tools'); App.go('shifts'); }, 'Tiện ích');
  App.state('Tìm thuốc', () => { App.reset('tools'); App.go('stockSearch'); }, 'Tiện ích');
})();
