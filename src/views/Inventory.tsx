import { useState, useEffect } from 'react';
import { usePos, InventoryHistory } from '../contexts/PosContext';
import ProductModal from '../components/modals/ProductModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ConfigureRolloverModal from '../components/modals/ConfigureRolloverModal';
import { showNotification } from '../utils/toast';

export default function Inventory() {
  const { 
    products, getStock, formatPrice, deleteProductFromDB, currentUser, 
    fetchInventoryHistory, reconcileProductStock, previousMonthYear,
    purchases, invoices 
  } = usePos();

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'audit'>('current');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState<{ id: number; name: string } | null>(null);

  // History state
  const [historyMonth, setHistoryMonth] = useState(previousMonthYear);
  const [historyData, setHistoryData] = useState<InventoryHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyMonth]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const data = await fetchInventoryHistory(historyMonth);
    setHistoryData(data);
    setIsLoadingHistory(false);
  };

  const filteredInvProducts = products
    .filter(p => p.name.toLowerCase().includes(invSearchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const openProductModal = (id: number | null) => {
    setEditingProductId(id);
    setShowProductModal(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteInfo) return;
    try {
      await deleteProductFromDB(confirmDeleteInfo.id);
      showNotification('Xóa sản phẩm thành công!', 'success');
    } catch (e) {
      showNotification('Lỗi khi xóa sản phẩm!', 'error');
      console.error(e);
    }
    setConfirmDeleteInfo(null);
  };

  // --- AUDIT LOGIC ---
  const currentMonthStr = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;
  
  const getAuditData = () => {
    return products.map(p => {
      let expectedIn = 0;
      for (const pur of purchases) {
        if (pur.date.includes(currentMonthStr)) {
          const item = pur.items.find(i => i.productId === p.id);
          if (item) expectedIn += item.qty;
        }
      }
      let expectedOut = 0;
      for (const inv of invoices) {
        if (inv.status !== 'deleted' && inv.time.includes(currentMonthStr)) {
          const item = inv.items.find(i => i.id === p.id);
          if (item) expectedOut += item.qty;
        }
      }
      const isMismatch = p.totalIn !== expectedIn || p.totalOut !== expectedOut;
      return { ...p, expectedIn, expectedOut, isMismatch };
    });
  };

  const auditData = activeTab === 'audit' ? getAuditData() : [];
  const hasMismatches = auditData.some(d => d.isMismatch);

  const handleReconcile = async (productId: number) => {
    try {
      await reconcileProductStock(productId);
      showNotification('Đã tự động đồng bộ và sửa lệch thành công!', 'success');
    } catch (e) {
      showNotification('Có lỗi khi đồng bộ!', 'error');
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Kho hàng</h2>
          <p className="text-gray-500 text-sm">Quản lý sản phẩm, tồn kho và đối soát dữ liệu</p>
        </div>
        {activeTab === 'current' && currentUser?.role === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold shadow-sm transition border flex items-center gap-2"
            >
              <i className="fa-solid fa-gear"></i> Cài đặt ngày chốt
            </button>
            <button
              onClick={() => openProductModal(null)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Thêm sản phẩm
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg w-fit shadow-sm border">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${activeTab === 'current' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Tồn kho hiện tại
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${activeTab === 'history' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Lịch sử chốt tồn
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-md font-bold text-sm transition ${activeTab === 'audit' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <i className="fa-solid fa-shield-halved mr-1"></i> Đối soát kho
          </button>
        )}
      </div>

      {activeTab === 'current' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <input
              type="text"
              value={invSearchQuery}
              onChange={e => setInvSearchQuery(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-64 p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <th className="p-3 border-b text-center w-12">STT</th>
                  <th className="p-3 border-b">Tên sản phẩm</th>
                  <th className="p-3 border-b text-center">ĐVT</th>
                  <th className="p-3 border-b text-right">Giá nhập</th>
                  <th className="p-3 border-b text-right">Giá bán</th>
                  <th className="p-3 border-b text-center" title="Tồn đầu">T.Đầu</th>
                  <th className="p-3 border-b text-center text-blue-600" title="Tổng nhập">T.Nhập</th>
                  <th className="p-3 border-b text-center text-red-600" title="Tổng xuất">T.Xuất</th>
                  <th className="p-3 border-b text-center font-bold text-teal-700">Tồn kho</th>
                  <th className="p-3 border-b text-center">Trạng thái</th>
                  <th className="p-3 border-b text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvProducts.map((p, index) => {
                  const s = getStock(p);
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-center font-bold text-gray-500">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.category}</div>
                      </td>
                      <td className="p-3 text-center text-gray-500">{p.unit}</td>
                      <td className="p-3 text-right font-mono">{formatPrice(p.importPrice)}</td>
                      <td className="p-3 text-right font-mono">{formatPrice(p.sellPrice)}</td>
                      <td className="p-3 text-center">{p.initialStock}</td>
                      <td className="p-3 text-center text-blue-600">{p.totalIn}</td>
                      <td className="p-3 text-center text-red-600">{p.totalOut}</td>
                      <td className="p-3 text-center font-bold text-teal-700 text-base">{s}</td>
                      <td className="p-3 text-center">
                        {s <= 0 ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Hết hàng</span>
                        ) : s <= 10 ? (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Sắp hết</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Còn hàng</span>
                        )}
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => openProductModal(p.id)}
                          className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-bold transition"
                          title="Sửa"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteInfo({ id: p.id, name: p.name })}
                          className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-bold transition"
                          title="Xóa"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
            <label className="font-bold text-sm text-gray-700">Chọn tháng (MM/YYYY):</label>
            <input
              type="text"
              value={historyMonth}
              onChange={e => setHistoryMonth(e.target.value)}
              placeholder="VD: 04/2026"
              className="w-32 p-1.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-center font-mono"
            />
            <button onClick={loadHistory} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold transition">
              <i className="fa-solid fa-search"></i> Tra cứu
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {isLoadingHistory ? (
              <div className="p-12 text-center text-gray-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</div>
            ) : historyData.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Không tìm thấy dữ liệu chốt tồn kho cho tháng {historyMonth}</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <th className="p-3 border-b">Mã SP</th>
                    <th className="p-3 border-b">Tên sản phẩm</th>
                    <th className="p-3 border-b text-center">Tồn đầu {historyMonth}</th>
                    <th className="p-3 border-b text-center text-blue-600">Tổng nhập</th>
                    <th className="p-3 border-b text-center text-red-600">Tổng xuất</th>
                    <th className="p-3 border-b text-center font-bold text-teal-700">Tồn cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map(d => {
                    const product = products.find(p => p.id === d.productId);
                    return (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs text-gray-500">{d.productId}</td>
                        <td className="p-3 font-bold text-gray-800">{product ? product.name : `Sản phẩm ${d.productId} (đã xóa)`}</td>
                        <td className="p-3 text-center">{d.initialStock}</td>
                        <td className="p-3 text-center text-blue-600">+{d.totalIn}</td>
                        <td className="p-3 text-center text-red-600">-{d.totalOut}</td>
                        <td className="p-3 text-center font-bold text-teal-700 text-base">{d.endingStock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-amber-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <i className="fa-solid fa-shield-halved"></i> Hệ thống Đối soát tự động
              </h3>
              <p className="text-amber-700 text-xs mt-1">So khớp số lượng Nhập/Xuất trong bộ đếm với giao dịch gốc thực tế của tháng {currentMonthStr}</p>
            </div>
            {hasMismatches && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-2 shadow-sm animate-pulse">
                <i className="fa-solid fa-triangle-exclamation"></i> Phát hiện sai lệch số liệu
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <th className="p-3 border-b">Sản phẩm</th>
                  <th className="p-3 border-b text-center border-l bg-blue-50/50">DB Nhập</th>
                  <th className="p-3 border-b text-center bg-blue-50/50">Gốc Nhập</th>
                  <th className="p-3 border-b text-center border-l bg-red-50/50">DB Xuất</th>
                  <th className="p-3 border-b text-center bg-red-50/50">Gốc Xuất</th>
                  <th className="p-3 border-b text-center border-l">Trạng thái</th>
                  <th className="p-3 border-b text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {auditData.map(d => (
                  <tr key={d.id} className={`border-b ${d.isMismatch ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="p-3">
                      <div className="font-bold text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-500">Tồn đầu: {d.initialStock}</div>
                    </td>
                    <td className={`p-3 text-center border-l ${d.totalIn !== d.expectedIn ? 'text-red-500 font-bold' : ''}`}>{d.totalIn}</td>
                    <td className="p-3 text-center text-blue-700 font-bold">{d.expectedIn}</td>
                    <td className={`p-3 text-center border-l ${d.totalOut !== d.expectedOut ? 'text-red-500 font-bold' : ''}`}>{d.totalOut}</td>
                    <td className="p-3 text-center text-red-700 font-bold">{d.expectedOut}</td>
                    <td className="p-3 text-center border-l">
                      {d.isMismatch ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Lệch 🔴</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Khớp 🟢</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {d.isMismatch ? (
                        <button
                          onClick={() => handleReconcile(d.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold transition shadow-sm"
                        >
                          Sửa lệch
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs"><i className="fa-solid fa-check"></i> OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showProductModal && (
        <ProductModal
          productId={editingProductId}
          onClose={() => { setShowProductModal(false); setEditingProductId(null); }}
        />
      )}

      {confirmDeleteInfo !== null && (
        <ConfirmModal
          title="Xác nhận xóa"
          message={`Bạn có chắc chắn muốn xóa sản phẩm "${confirmDeleteInfo.name}" khỏi kho không?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteInfo(null)}
        />
      )}

      {showConfigModal && (
        <ConfigureRolloverModal onClose={() => {
          setShowConfigModal(false);
          // Reload page to re-evaluate lock status immediately
          window.location.reload();
        }} />
      )}
    </div>
  );
}
