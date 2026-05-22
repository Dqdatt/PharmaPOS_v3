import { useState, useEffect } from 'react';
import { usePos } from '../contexts/PosContext';
import POS from './POS';
import Inventory from './Inventory';
import Imports from './Imports';
import Reports from './Reports';
import Employees from './Employees';
import Exports from './Exports';
import { showNotification } from '../utils/toast';
import ConfirmModal from '../components/modals/ConfirmModal';
import CloseInventoryModal from '../components/modals/CloseInventoryModal';

type Tab = 'pos' | 'inventory' | 'import' | 'exports' | 'reports' | 'employees';

export default function MainApp() {
  const { currentUser, setCurrentUser, updateStaffLogLogoutInDB, cart, setCart, getNow, isPreviousMonthClosed, checkPreviousMonthStatus } = usePos();
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
        const errMsg = e instanceof Error ? e.message : String(e);
        showNotification(`Lỗi khi ghi nhận đăng xuất! Chi tiết: ${errMsg}`, 'error');
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

  if (isPreviousMonthClosed === false) {
    if (currentUser.role === 'admin') {
      return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
          <CloseInventoryModal isForced={true} />
        </div>
      );
    } else {
      return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-red-100 shadow-sm">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h3 className="font-bold text-2xl text-gray-800 mb-3">Hệ thống đang tạm khóa</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Hệ thống đang chờ Quản trị viên (Admin) thực hiện chốt tồn kho đầu tháng mới. 
              Vui lòng liên hệ Admin để hoàn thành quá trình này trước khi bắt đầu bán hàng.
            </p>
            <div className="space-y-3">
              <button
                onClick={checkPreviousMonthStatus}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition shadow-sm"
              >
                <i className="fa-solid fa-rotate-right mr-2"></i> Kiểm tra lại trạng thái
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

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
            onClick={() => setCurrentTab('exports')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${currentTab === 'exports' ? 'bg-teal-900' : 'hover:bg-teal-600'}`}
          >
            <i className="fa-solid fa-truck-fast"></i><span className="hidden sm:inline">Xuất Kho</span>
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
        {currentTab === 'exports' && <Exports />}
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
