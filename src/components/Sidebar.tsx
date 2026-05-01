import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'POS Bán Hàng', icon: 'point_of_sale', path: '/pos' },
  { name: 'Kho Hàng', icon: 'inventory_2', path: '/inventory' },
  { name: 'Nhập Hàng', icon: 'input', path: '/imports' },
  { name: 'Báo Cáo', icon: 'assessment', path: '/reports' },
  { name: 'Hóa Đơn', icon: 'receipt_long', path: '#' },
  { name: 'Nhân Viên', icon: 'badge', path: '/employees' },
  { name: 'Tài Khoản', icon: 'account_circle', path: '#' },
  { name: 'Cài Đặt', icon: 'settings', path: '#' },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-primary-container shadow-lg flex flex-col z-40">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight leading-none">MedPoint POS</h1>
        <p className="text-teal-100/70 text-[10px] uppercase tracking-widest mt-1">Pharmacy Solutions</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center px-4 py-3 gap-3 transition-all rounded-lg text-teal-100/70 hover:text-white hover:bg-white/5",
              isActive && "bg-white/10 border-l-4 border-teal-400 text-white fill-icon"
            )}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">M</div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Dược Sĩ Minh</p>
            <p className="text-[11px] text-teal-100/50 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
