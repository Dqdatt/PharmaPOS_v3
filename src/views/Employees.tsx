import { useState } from 'react';
import { usePos } from '../contexts/PosContext';

const statusLabels = {
  invited: 'Đã mời',
  active: 'Hoạt động',
  locked: 'Đã khóa',
};

export default function Employees() {
  const { users, staffLogs, currentUser } = usePos();
  const [staffTab, setStaffTab] = useState<'logs' | 'accounts'>('logs');
  const [currentPage, setCurrentPage] = useState(1);

  const reversedLogs = [...staffLogs].reverse();
  const logsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(reversedLogs.length / logsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLogs = reversedLogs.slice((safeCurrentPage - 1) * logsPerPage, safeCurrentPage * logsPerPage);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhân Sự</h2>
          <p className="text-gray-500 text-sm">Theo dõi tài khoản và ca làm việc</p>
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
          onClick={() => setStaffTab('accounts')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${staffTab === 'accounts' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
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
            <>
              {paginatedLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b last:border-0 hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${log.role === 'manager' ? 'bg-red-500' : 'bg-teal-500'}`}>
                    {log.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {log.name}{' '}
                      <span className="text-xs font-normal text-gray-500 ml-1 bg-gray-100 px-1 rounded">{log.role === 'manager' ? 'Quản lý' : log.role === 'admin' ? 'Quản trị' : 'Nhân viên'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Vào: {log.loginTime}{' '}
                      {log.logoutTime ? (
                        <span>· Ra: {log.logoutTime}</span>
                      ) : (
                        (currentUser && currentUser.id === log.userId && i === 0 && safeCurrentPage === 1) ? (
                          <span className="text-green-600 font-bold ml-1">· Đang làm việc</span>
                        ) : (
                          <span className="text-red-500 font-bold ml-1">· Ra: LỖI</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {reversedLogs.length > 0 && (
                <div className="pt-4 mt-2 border-t flex justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Tổng: <b>{reversedLogs.length}</b> bản ghi
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span className="text-sm px-3 font-medium text-gray-700">
                      {safeCurrentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {staffTab === 'accounts' && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="mb-4 text-sm text-gray-500">Cấp và sửa tài khoản trong app MediPOS (tài khoản quản trị).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Quyền hạn</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${u.role === 'manager' ? 'bg-red-500' : 'bg-teal-500'}`}>
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded font-bold border ${u.role === 'manager' ? 'bg-red-50 text-red-600 border-red-200' : u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                        {u.role === 'manager' ? 'Quản lý' : u.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{u.status ? statusLabels[u.status] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
