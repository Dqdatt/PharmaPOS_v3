export default function Inventory() {
  const items = [
    { sku: 'MD-1024', name: 'Panadol Extra (Vỉ 10 viên)', category: 'Giảm đau', start: 500, import: 200, export: 150, current: 550, buyPrice: 18500, sellPrice: 25000, status: 'In Stock' },
    { sku: 'MD-8821', name: 'Augmentin 625mg (Hộp)', category: 'Kháng sinh', start: 40, import: 10, export: 42, current: 8, buyPrice: 145000, sellPrice: 175000, status: 'Low Stock' },
    { sku: 'MD-0056', name: 'Vitamin C 500mg (Lọ)', category: 'Thực phẩm CN', start: 100, import: 0, export: 100, current: 0, buyPrice: 65000, sellPrice: 95000, status: 'Out of Stock' },
    { sku: 'MD-4432', name: 'Strepsils Cool (Hộp)', category: 'Hô hấp', start: 250, import: 50, export: 80, current: 220, buyPrice: 12000, sellPrice: 18000, status: 'In Stock' },
    { sku: 'MD-7719', name: 'Berocca Performance (Tuýp)', category: 'Thực phẩm CN', start: 15, import: 10, export: 20, current: 5, buyPrice: 82000, sellPrice: 105000, status: 'Low Stock' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: '1,248', delta: '+12 tháng này', icon: 'inventory', color: 'text-primary' },
          { label: 'Tổng tồn kho', value: '42,500', delta: 'Đv: Viên/Chai/Hộp', icon: 'package_2', color: 'text-primary' },
          { label: 'Giá trị kho', value: '1.45B', delta: 'VND', icon: 'payments', color: 'text-primary' },
          { label: 'Sắp hết hàng', value: '24', delta: 'Cần nhập thêm', icon: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50/50' },
          { label: 'Hết hàng', value: '8', delta: 'Cần xử lý ngay', icon: 'dangerous', color: 'text-error', bg: 'bg-red-50/50' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white border border-outline-variant p-4 rounded-xl shadow-sm ${stat.bg || ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{stat.value}</div>
            <div className={`text-[10px] font-medium mt-1 ${stat.color}`}>{stat.delta}</div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Danh Sách Kho Hàng</h2>
            <div className="flex items-center gap-1 bg-white border border-outline-variant px-3 py-1.5 rounded-lg cursor-pointer">
              <span className="material-symbols-outlined text-sm text-slate-400">filter_list</span>
              <span className="text-sm font-medium">Tất cả nhóm hàng</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-sm font-medium px-4 py-2 hover:bg-slate-50 border border-outline-variant bg-white rounded-lg">
              <span className="material-symbols-outlined text-lg">download</span> Xuất file
            </button>
            <button className="flex items-center gap-1 text-sm font-medium px-4 py-2 hover:bg-slate-50 border border-outline-variant bg-white rounded-lg">
              <span className="material-symbols-outlined text-lg">print</span> In danh sách
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">SKU</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Tồn hiện tại</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Giá bán</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map(item => (
                <tr key={item.sku} className={`hover:bg-surface-container-low transition-colors ${item.current === 0 ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-4 font-medium text-primary text-xs">{item.sku}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.name}</td>
                  <td className={`px-4 py-4 text-right font-bold ${item.current < 10 ? 'text-orange-600' : 'text-on-surface'}`}>{item.current}</td>
                  <td className="px-4 py-4 text-right text-sm font-medium">{item.sellPrice.toLocaleString()}đ</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 flex items-center justify-center gap-2">
                    <button className="p-1 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                    <button className="p-1 hover:text-error"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info Container */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-outline-variant p-6 rounded-xl shadow-sm h-64 flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-1">Biến Động Tồn Kho 7 Ngày Qua</h3>
            <p className="text-slate-500 text-xs">Theo dõi lưu lượng nhập xuất thuốc định kỳ</p>
          </div>
          <div className="flex items-end gap-4 h-32">
            {[60, 75, 40, 90, 65, 55, 80].map((h, i) => (
              <div key={i} className="flex-1 bg-teal-200 hover:bg-primary transition-colors rounded-t-lg" style={{ height: `${h}%` }}></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
        </div>
        <div className="bg-primary-container text-white p-6 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Tối Ưu Hóa Nhập Kho</h3>
            <p className="text-teal-100/80 text-sm">Hệ thống AI gợi ý nhập thêm 15 danh mục thuốc đang có xu hướng bán chạy tại khu vực.</p>
          </div>
          <button className="relative z-10 w-full py-3 bg-white text-primary font-bold rounded-lg hover:bg-teal-50 shadow-lg">Xem Gợi Ý</button>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}
