import { useState } from 'react';
import { usePos } from '../contexts/PosContext';
import ProductModal from '../components/modals/ProductModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { showNotification } from '../utils/toast';

export default function Inventory() {
  const { products, getStock, formatPrice, deleteProductFromDB } = usePos();
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const filteredInvProducts = products.filter(p =>
    p.name.toLowerCase().includes(invSearchQuery.toLowerCase())
  );

  const openProductModal = (id: number | null) => {
    setEditingProductId(id);
    setShowProductModal(true);
  };

  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState<{ id: number; name: string } | null>(null);

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

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Kho hàng</h2>
          <p className="text-gray-500 text-sm">Quản lý sản phẩm và tồn kho hiện tại</p>
        </div>
        <button
          onClick={() => openProductModal(null)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition"
        >
          <i className="fa-solid fa-plus mr-2"></i>Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
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
              {filteredInvProducts.map(p => {
                const s = getStock(p);
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
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
    </div>
  );
}
