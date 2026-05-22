import { useState } from 'react';
import { usePos } from '../contexts/PosContext';
import StaffModal from '../components/modals/StaffModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { showNotification } from '../utils/toast';

export default function Employees() {
  const { users, deleteUserFromDB, staffLogs, invoices, currentUser } = usePos();
  const [staffTab, setStaffTab] = useState<'logs' | 'revenue' | 'edit'>('logs');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);

  const openStaffModal = (id: number | null) => {
    setEditingStaffId(id);
    setShowStaffModal(true);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    try {
      await deleteUserFromDB(confirmDeleteId);
      showNotification('Xóa nhân viên thành công!', 'success');
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi xóa nhân viên! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
    }
    setConfirmDeleteId(null);
  };

  const getRevenueByEmployee = (name: string) =>
    invoices.filter(i => i.employeeName === name).reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhân Sự</h2>
          <p className="text-gray-500 text-sm">Theo dõi hoạt động và phân quyền nhân viên</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg w-fit shadow-sm border">
        <button
          onClick={() => setStaffTab('logs')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${staffTab === 'logs' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Lịch sử In/Out
        </button>
        <button
          onClick={() => setStaffTab('revenue')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${staffTab === 'revenue' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Doanh thu NV
        </button>
        <button
          onClick={() => setStaffTab('edit')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${staffTab === 'edit' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Tài khoản
        </button>
      </div>

      {/* Logs tab */}
      {staffTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          {staffLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Chưa có dữ liệu đăng nhập</div>
          ) : (
            [...staffLogs].reverse().map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border-b last:border-0 hover:bg-gray-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${log.role === 'admin' ? 'bg-red-500' : 'bg-teal-500'}`}>
                  {log.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {log.name}{' '}
                    <span className="text-xs font-normal text-gray-500 ml-1 bg-gray-100 px-1 rounded">{log.role}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Vào: {log.loginTime}{' '}
                    {log.logoutTime ? (
                      <span>· Ra: {log.logoutTime}</span>
                    ) : (
                      (currentUser && currentUser.id === log.userId && i === 0) ? (
                        <span className="text-green-600 font-bold ml-1">· Đang làm việc</span>
                      ) : (
                        <span className="text-red-500 font-bold ml-1">· Ra: LỖI</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Revenue tab */}
      {staffTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${u.role === 'admin' ? 'bg-red-500' : 'bg-teal-500'}`}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</div>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold mb-1">Doanh thu tạo ra</div>
                  <div className="font-mono font-bold text-xl text-teal-700">
                    {new Intl.NumberFormat('vi-VN').format(getRevenueByEmployee(u.name))} ₫
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit tab */}
      {staffTab === 'edit' && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <button
            onClick={() => openStaffModal(null)}
            className="mb-4 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold transition"
          >
            <i className="fa-solid fa-user-plus mr-1"></i> Thêm tài khoản
          </button>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Quyền hạn</th>
                  <th className="p-3">Mã PIN</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${u.role === 'admin' ? 'bg-red-500' : 'bg-teal-500'}`}>
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded font-bold border ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-700 tracking-widest">{u.pin || 'Chưa cài'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openStaffModal(u.id)}
                        className="text-blue-500 hover:text-blue-700 px-2"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStaffModal && (
        <StaffModal
          userId={editingStaffId}
          onClose={() => { setShowStaffModal(false); setEditingStaffId(null); }}
        />
      )}

      {confirmDeleteId !== null && (
        <ConfirmModal
          title="Xác nhận xóa"
          message="Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Hành động này không thể hoàn tác."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
