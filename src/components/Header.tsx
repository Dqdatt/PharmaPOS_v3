import { Search, Bell, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="h-16 fixed top-0 right-0 left-64 z-30 bg-white border-b border-outline-variant shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" 
            placeholder="Tìm kiếm sản phẩm, SKU... (Ctrl+K)" 
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="hover:bg-surface-container rounded-lg p-2 text-outline relative transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>
        <button className="hover:bg-surface-container rounded-lg p-2 text-outline transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <div className="h-8 w-px bg-outline-variant mx-1"></div>
        <button 
          className="hover:bg-error-container rounded-lg p-2 text-error transition-colors"
          onClick={() => navigate('/login')}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}
