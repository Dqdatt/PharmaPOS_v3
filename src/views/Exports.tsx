import { useState, useMemo } from 'react';
import { usePos, ExportOrder } from '../contexts/PosContext';
import { showNotification } from '../utils/toast';
import ExportModal from '../components/modals/ExportModal';
import ExportDetailModal from '../components/modals/ExportDetailModal';
import VietQRConfigModal from '../components/modals/VietQRConfigModal';
import ConfirmModal from '../components/modals/ConfirmModal';

export default function Exports() {
  const { exportOrders, products, updateExportOrderStatusInDB, deleteExportOrderFromDB, formatPrice } = usePos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<ExportOrder | undefined>(undefined);
  const [viewingOrder, setViewingOrder] = useState<ExportOrder | undefined>(undefined);

  const filteredOrders = useMemo(() => {
    return exportOrders.filter(o => {
      const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.recipientPhone?.includes(searchTerm);
      const matchStatus = statusFilter ? o.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [exportOrders, searchTerm, statusFilter]);

  const handleStatusChange = async (orderId: string, oldStatus: ExportOrder['status'], newStatus: string) => {
    setIsProcessing(true);
    try {
      await updateExportOrderStatusInDB(orderId, oldStatus, newStatus as ExportOrder['status']);
      showNotification(`Đã cập nhật trạng thái đơn ${orderId}!`, 'success');
    } catch (e) {
      showNotification(`Lỗi cập nhật trạng thái đơn ${orderId}!`, 'error');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    setIsProcessing(true);
    try {
      await deleteExportOrderFromDB(orderToDelete);
      showNotification('Đã xóa đơn xuất kho!', 'success');
      if (viewingOrder?.id === orderToDelete) setViewingOrder(undefined);
    } catch (e) {
      showNotification('Lỗi khi xóa đơn xuất kho!', 'error');
    } finally {
      setIsProcessing(false);
      setOrderToDelete(null);
    }
  };

  const openNew = () => {
    setEditingOrder(undefined);
    setIsExportModalOpen(true);
  };

  const openEdit = (o: ExportOrder) => {
    setEditingOrder(o);
    setIsExportModalOpen(true);
    setViewingOrder(undefined);
  };

  const getStatusBadge = (status: ExportOrder['status']) => {
    switch (status) {
      case 'exported': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">Đã xuất kho</span>;
      case 'sent': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">Đã gửi hàng</span>;
      case 'received': return <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-bold">Khách đã nhận</span>;
      case 'pending_payment': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">Chờ thanh toán</span>;
      case 'paid': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">Đã thanh toán</span>;
      case 'returned': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Hoàn đơn</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="w-full p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-gray-50/50">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <i className="fa-solid fa-truck-fast text-teal-600"></i>
            Quản Lý Xuất Kho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Xuất kho sỉ, bán ngoài POS, quản lý giao hàng & thanh toán</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-building-columns text-blue-500"></i> Cấu hình VietQR
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Tạo Đơn Xuất
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 shrink-0 flex gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-gray-700 font-medium"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="exported">Đã xuất kho</option>
          <option value="sent">Đã gửi hàng</option>
          <option value="received">Khách đã nhận</option>
          <option value="pending_payment">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="returned">Hoàn đơn</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-bold w-32">Mã Đơn</th>
                <th className="px-6 py-4 font-bold">Khách Hàng</th>
                <th className="px-6 py-4 font-bold">Ngày Xuất</th>
                <th className="px-6 py-4 font-bold text-right">Tổng Tiền</th>
                <th className="px-6 py-4 font-bold text-center">Trạng Thái</th>
                <th className="px-6 py-4 font-bold text-center w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <i className="fa-solid fa-box-open text-4xl mb-3 block text-gray-300"></i>
                    Không tìm thấy đơn xuất kho nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition group cursor-pointer" onClick={() => setViewingOrder(o)}>
                    <td className="px-6 py-4 font-bold text-gray-700">{o.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{o.recipientName}</div>
                      {o.recipientPhone && <div className="text-xs text-gray-500"><i className="fa-solid fa-phone mr-1"></i>{o.recipientPhone}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.date}</td>
                    <td className="px-6 py-4 font-mono font-bold text-teal-600 text-right">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, o.status, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none border-transparent cursor-pointer 
                          ${o.status === 'paid' ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                          ${o.status === 'pending_payment' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : ''}
                          ${o.status === 'exported' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''}
                          ${o.status === 'sent' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : ''}
                          ${o.status === 'received' ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' : ''}
                          ${o.status === 'returned' ? 'bg-red-50 text-red-700 hover:bg-red-100' : ''}
                        `}
                      >
                        <option value="exported">Đã xuất kho</option>
                        <option value="sent">Đã gửi hàng</option>
                        <option value="received">Khách đã nhận</option>
                        <option value="pending_payment">Chờ thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="returned">Hoàn đơn</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }}
                        className="w-8 h-8 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Xóa đơn"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center text-sm text-gray-500 shrink-0">
          <span>Hiển thị <span className="font-bold text-gray-700">{filteredOrders.length}</span> đơn xuất kho</span>
        </div>
      </div>

      {isExportModalOpen && (
        <ExportModal 
          initialData={editingOrder} 
          onClose={() => {
            setIsExportModalOpen(false);
            setEditingOrder(undefined);
          }} 
        />
      )}

      {isConfigModalOpen && (
        <VietQRConfigModal onClose={() => setIsConfigModalOpen(false)} />
      )}

      {viewingOrder && (
        <ExportDetailModal 
          order={viewingOrder} 
          onClose={() => setViewingOrder(undefined)} 
          onEdit={() => openEdit(viewingOrder)}
        />
      )}

      {orderToDelete && (
        <ConfirmModal
          title="Xác nhận xóa?"
          message="Đơn xuất kho sẽ bị xóa và tồn kho sẽ được hoàn lại (nếu chưa hoàn). Bạn có chắc chắn?"
          onConfirm={confirmDelete}
          onCancel={() => setOrderToDelete(null)}
        />
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black/20 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-teal-600 mb-3"></i>
            <p className="font-bold text-gray-700">Đang xử lý...</p>
          </div>
        </div>
      )}
    </div>
  );
}
