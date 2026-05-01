import { useState } from 'react';

const products = [
  { id: 'PN-001', name: 'Panadol Extra 500mg - Hộp 100 viên', price: 25000, stock: 50, category: 'Giảm đau' },
  { id: 'AM-250', name: 'Amoxicillin 250mg - Hộp 10 vỉ', price: 18500, stock: 120, category: 'Kháng sinh' },
  { id: 'VIT-C', name: 'Vitamin C 1000mg - Lọ 30 viên', price: 115000, stock: 45, category: 'C' },
  { id: 'MASK-01', name: 'Khẩu trang y tế 3D - Hộp 50 cái', price: 45000, stock: 200, category: 'Vật tư' },
];

export default function POS() {
  const [cart, setCart] = useState<{ product: any, count: number }[]>([
    { product: products[0], count: 2 },
    { product: products[1], count: 1 },
  ]);

  const total = cart.reduce((acc, item) => acc + item.product.price * item.count, 0);

  return (
    <div className="flex h-full overflow-hidden bg-slate-50/50">
      {/* Left Panel: Catalog */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200">
          <button className="px-5 py-3 text-sm font-bold border-b-2 border-primary text-primary">Tất cả</button>
          <button className="px-5 py-3 text-sm font-medium text-slate-500 hover:text-primary transition-colors">Kháng sinh</button>
          <button className="px-5 py-3 text-sm font-medium text-slate-500 hover:text-primary transition-colors">Thực phẩm chức năng</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-primary transition-all group flex flex-col justify-between h-44 shadow-sm">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SKU: {p.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${p.stock < 10 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>KHO: {p.stock}</span>
                </div>
                <h3 className="font-semibold text-sm mt-3 text-slate-900 leading-tight group-hover:text-primary transition-colors">{p.name}</h3>
              </div>
              <div className="flex justify-between items-center mt-auto pt-4">
                <span className="text-primary font-bold text-lg">{p.price.toLocaleString()}đ</span>
                <button className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm font-medium" 
              placeholder="Tìm khách hàng (SĐT, tên)..." 
              type="text"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm mr-1">person</span>
              <span>Khách lẻ</span>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">Thay đổi</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.map(item => (
            <div key={item.product.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{item.product.name}</h4>
                  <button className="text-slate-300 hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
                    <button className="px-2 py-1 text-slate-500 hover:bg-slate-100 border-r border-slate-200">-</button>
                    <span className="w-8 text-center text-xs font-bold py-1">{item.count.toString().padStart(2, '0')}</span>
                    <button className="px-2 py-1 text-slate-500 hover:bg-slate-100 border-l border-slate-200">+</button>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{(item.product.price * item.count).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center space-x-2 py-2.5 rounded-lg border-2 border-primary bg-primary/5 text-primary text-sm font-bold">
              <span className="material-symbols-outlined text-lg">payments</span>
              <span>TIỀN MẶT</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-2.5 rounded-lg border-2 border-transparent bg-white text-slate-500 text-sm font-bold shadow-sm">
              <span className="material-symbols-outlined text-lg">account_balance</span>
              <span>CHUYỂN KHOẢN</span>
            </button>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-3xl">qr_code_2</span>
            </div>
            <div className="text-[11px] space-y-0.5 overflow-hidden">
              <p className="font-bold text-slate-900 uppercase truncate">MB Bank - 0987654321</p>
              <p className="text-slate-600 truncate">MedPoint POS Solution</p>
              <p className="text-primary font-bold">Số tiền: {total.toLocaleString()}đ</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tạm tính ({cart.length} sản phẩm)</span>
              <span className="font-medium">{total.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 font-bold border-t border-dashed border-slate-200 pt-3">
              <span className="text-lg uppercase">Thành tiền</span>
              <span className="text-2xl text-primary font-black">{total.toLocaleString()}đ</span>
            </div>
          </div>

          <button className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
            <span className="material-symbols-outlined">point_of_sale</span>
            <span>THANH TOÁN (F12)</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
