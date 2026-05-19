import { useState } from 'react';
import { usePos } from '../contexts/PosContext';
import POModal from '../components/modals/POModal';
import DetailModal from '../components/modals/DetailModal';
import { Purchase } from '../contexts/PosContext';

export default function Imports() {
  const { purchases, formatPrice } = usePos();
  const [showPoModal, setShowPoModal] = useState(false);
  const [viewingPo, setViewingPo] = useState<Purchase | null>(null);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lịch sử Nhập hàng</h2>
          <p className="text-gray-500 text-sm">Quản lý các phiếu nhập hàng từ nhà cung cấp</p>
        </div>
        <button
          onClick={() => setShowPoModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition"
        >
          <i className="fa-solid fa-file-invoice mr-2"></i>Tạo phiếu nhập
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                <th className="p-3 border-b">Mã phiếu</th>
                <th className="p-3 border-b">Ngày tạo</th>
                <th className="p-3 border-b">Nhà cung cấp</th>
                <th className="p-3 border-b text-center">Số SP</th>
                <th className="p-3 border-b text-right">Tổng tiền nhập</th>
                <th className="p-3 border-b text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chưa có phiếu nhập nào</td></tr>
              ) : (
                purchases.map(po => (
                  <tr key={po.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold text-teal-600">{po.id}</td>
                    <td className="p-3 text-gray-600">{po.date}</td>
                    <td className="p-3 font-medium">{po.supplier}</td>
                    <td className="p-3 text-center">
                      <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{po.items.length}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-red-600 font-mono">{formatPrice(po.total)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setViewingPo(po)}
                        className="text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200 text-xs font-bold transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPoModal && <POModal onClose={() => setShowPoModal(false)} />}
      {viewingPo && (
        <DetailModal
          type="PO"
          data={viewingPo}
          onClose={() => setViewingPo(null)}
        />
      )}
    </div>
  );
}
