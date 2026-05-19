import { useState, useEffect } from 'react';
import { usePos } from '../contexts/PosContext';
import POS from './POS';
import Inventory from './Inventory';
import Imports from './Imports';
import Reports from './Reports';
import Employees from './Employees';
import { showNotification } from '../utils/toast';
import ConfirmModal from '../components/modals/ConfirmModal';

type Tab = 'pos' | 'inventory' | 'import' | 'reports' | 'employees';

export default function MainApp() {
  const { currentUser, setCurrentUser, updateStaffLogLogoutInDB, cart, setCart, getNow } = usePos();
  const [currentTab, setCurrentTab] = useState<Tab>('pos');
  const [currentTime, setCurrentTime] = useState(getNow(true));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getNow(true)), 1000);
    return () => clearInterval(timer);
  }, []);

  const logout = async () => {
    if (currentUser) {
      try {
        await updateStaffLogLogoutInDB(currentUser.id, getNow(true));
        showNotification(`Kết thúc ca ${currentUser.name}`, 'success');
      } catch (e) {
        console.error('Failed to log logout:', e);
      }
    }
    setCurrentUser(null);
    setCart([]);
  };

  const openCustomerScreen = () => {
    const url = window.location.href.split('?')[0] + '?view=customer';
    window.open(url, '_blank', 'width=1024,height=768');
    syncToCustomerView();
  };

  const syncToCustomerView = () => {
    const base = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const state = {
      cart,
      total: base,
      otherCosts: 0,
      paymentMethod: null,
    };
    localStorage.setItem('mediPosSync', JSON.stringify(state));
  };

  if (!currentUser) return null;

  return (
    <div className="h-screen flex flex-col">
      {/* NAV */}
      <nav className="bg-teal-700 text-white p-2 flex justify-between items-center shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 overflow-x-auto whitespace-nowrap">
          <div className="font-bold text-xl mr-4 flex items-center gap-2 border-r border-teal-500 pr-4">
            <i className="fa-solid fa-notes-medical"></i> MediPOS
          </div>
          <button
            onClick={() => setCurrentTab('pos')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'pos' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
          >
            <i className="fa-solid fa-cash-register"></i><span className="hidden sm:inline">Bán Hàng</span>
          </button>
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'inventory' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
          >
            <i className="fa-solid fa-boxes-stacked"></i><span className="hidden sm:inline">Kho Hàng</span>
          </button>
          <button
            onClick={() => setCurrentTab('import')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'import' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
          >
            <i className="fa-solid fa-truck-ramp-box"></i><span className="hidden sm:inline">Nhập Hàng</span>
          </button>
          <button
            onClick={() => setCurrentTab('reports')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'reports' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
          >
            <i className="fa-solid fa-chart-line"></i><span className="hidden sm:inline">Báo Cáo</span>
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('employees')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'employees' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
            >
              <i className="fa-solid fa-users"></i><span className="hidden sm:inline">Nhân Viên</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 pr-4">
          <div className="text-sm font-mono opacity-80 hidden md:block">{currentTime}</div>
          <div className="flex items-center gap-2 bg-teal-800 px-3 py-1.5 rounded-lg border border-teal-600">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-white text-teal-800">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-bold leading-none">{currentUser.name}</div>
              <div className="text-xs opacity-75">{currentUser.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</div>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-red-500 hover:bg-red-600 w-9 h-9 rounded-lg flex items-center justify-center font-bold transition"
            title="Kết thúc ca"
          >
            <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 overflow-hidden bg-gray-100 flex relative">
        {currentTab === 'pos' && <POS onOpenCustomerScreen={openCustomerScreen} />}
        {currentTab === 'inventory' && <Inventory />}
        {currentTab === 'import' && <Imports />}
        {currentTab === 'reports' && <Reports />}
        {currentTab === 'employees' && currentUser.role === 'admin' && <Employees />}
      </main>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Xác nhận đăng xuất"
          message={`Bạn có chắc chắn muốn kết thúc ca làm việc của ${currentUser.name}?`}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
