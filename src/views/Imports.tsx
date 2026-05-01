export default function Imports() {
  const products = [
    { name: 'Augmentin 625mg', unit: 'Hộp 14 viên', qty: 50, price: 155000, expiry: '12/2025', lot: 'LOT-A882', total: 7750000, icon: 'pill' },
    { name: 'Panadol Extra', unit: 'Vỉ 10 viên', qty: 100, price: 12500, expiry: '06/2026', lot: 'LOT-P991', total: 1250000, icon: 'vaccines' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 pb-24">
        <div className="flex items-end justify-between">
          <div>
            <nav className="flex gap-2 text-xs text-outline mb-2">
              <span>Kho Hàng</span>
              <span>/</span>
              <span className="text-primary font-bold">Nhập Hàng Mới</span>
            </nav>
            <h2 className="text-3xl font-bold tracking-tight">Nhập Hàng Từ Nhà Cung Cấp</h2>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-outline rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-lg">history</span> Lịch sử nhập
          </button>
        </div>

        <section className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Nhà cung cấp</label>
            <div className="relative">
              <select className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-container outline-none">
                <option>Chọn nhà cung cấp...</option>
                <option>Dược Phẩm Trung Ương 1</option>
                <option>Medipharm Vietnam</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">keyboard_arrow_down</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Mã phiếu nhập</label>
            <input className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3.5 text-sm font-bold text-outline" readonly value="PN-20231027-0042" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Ngày nhập</label>
            <div className="relative">
              <input className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-container outline-none" type="date" defaultValue="2023-10-27" />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">calendar_today</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
            <h3 className="font-bold">Danh sách dược phẩm nhập</h3>
            <button className="bg-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Thêm sản phẩm
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-outline">Sản phẩm</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-outline text-center">Số lượng</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-outline text-right">Giá nhập</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-outline text-center">Hết hạn</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-outline text-right">Thành tiền</th>
                <th className="px-6 py-4 w-12 font-bold uppercase text-outline"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {products.map((p, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{p.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[10px] text-outline">{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input className="w-20 bg-surface-container-low border border-outline-variant rounded-md px-2 py-1 text-center font-bold text-sm" defaultValue={p.qty} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-sm">{p.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold">{p.expiry}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{p.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button className="text-outline hover:text-error transition-colors"><span className="material-symbols-outlined text-lg">delete_outline</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 bg-surface-container-low flex justify-end gap-12 border-t border-outline-variant">
            <div className="text-right">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Tổng số mặt hàng</p>
              <p className="text-xl font-bold">02 sản phẩm</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Tổng tiền nhập hàng</p>
              <p className="text-xl font-bold text-primary">9.000.000 VNĐ</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="h-20 fixed bottom-0 right-0 left-64 bg-white border-t border-outline-variant px-8 flex items-center justify-between shadow-2xl z-50">
        <div className="flex items-center gap-2 text-outline text-xs italic font-medium">
          <span className="material-symbols-outlined text-sm">info</span> Mọi thay đổi sẽ được tự động lưu bản nháp
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-3.5 border border-outline rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">print</span> In phiếu nhập
          </button>
          <button className="px-12 py-3.5 bg-primary-container text-white rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg fill-icon">save</span> Lưu phiếu nhập
          </button>
        </div>
      </footer>
    </div>
  );
}
