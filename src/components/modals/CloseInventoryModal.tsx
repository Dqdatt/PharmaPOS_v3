import { useState } from 'react';
import { usePos } from '../../contexts/PosContext';
import { showNotification } from '../../utils/toast';

interface Props {
  onClose?: () => void;
  isForced?: boolean;
}

export default function CloseInventoryModal({ onClose, isForced = false }: Props) {
  const { products, getStock, formatPrice, closeMonthlyInventory, previousMonthYear } = usePos();
  const [isClosing, setIsClosing] = useState(false);

  // We only show products that have stock or had transactions
  const activeProducts = products.filter(p => p.initialStock > 0 || p.totalIn > 0 || p.totalOut > 0 || getStock(p) > 0);
  
  const handleCloseInventory = async () => {
    setIsClosing(true);
    try {
      await closeMonthlyInventory(previousMonthYear);
      showNotification(`Đã chốt tồn kho thành công cho tháng ${previousMonthYear}`, 'success');
      if (onClose) onClose();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Lỗi khi chốt tồn kho! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
      setIsClosing(false);
    }
  };

  return (
    <div className={isForced ? "h-full w-full flex items-center justify-center p-4 bg-transparent" : "fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className={`p-5 flex justify-between items-center ${isForced ? 'bg-red-50 border-b border-red-100' : 'bg-gray-50 border-b border-gray-200'}`}>
          <div>
            <h3 className={`font-bold text-xl ${isForced ? 'text-red-700' : 'text-gray-800'}`}>
              {isForced ? (
                <><i className="fa-solid fa-lock mr-2"></i> Bắt buộc Chốt Tồn Kho</>
              ) : (
                'Chốt Tồn Kho Định Kỳ'
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Tháng cần chốt: <span className="font-bold text-teal-700">{previousMonthYear}</span>
            </p>
          </div>
          {!isForced && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          )}
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm border border-blue-100 shadow-sm flex gap-3 items-start">
            <i className="fa-solid fa-circle-info text-lg mt-0.5 text-blue-500"></i>
            <div>
              <div className="font-bold mb-1">Quy trình chốt sổ sẽ thực hiện:</div>
              <ul className="list-disc ml-5 space-y-1 opacity-90">
                <li>Lưu lại bản chụp tồn kho hiện tại vào lịch sử của tháng <strong>{previousMonthYear}</strong>.</li>
                <li>Cập nhật Tồn kho hiện tại thành <strong>Tồn đầu kỳ mới</strong>.</li>
                <li><strong>Reset Tổng Nhập & Tổng Xuất</strong> của kỳ mới về 0.</li>
                <li>Lịch sử hóa đơn và phiếu nhập cũ <strong>không bị ảnh hưởng</strong>.</li>
              </ul>
            </div>
          </div>

          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-gray-400"></i> Xem trước số liệu chuyển kỳ
          </h4>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 border-b">Sản phẩm</th>
                  <th className="p-3 border-b text-center">Tồn đầu {previousMonthYear}</th>
                  <th className="p-3 border-b text-center text-blue-600">Tổng Nhập</th>
                  <th className="p-3 border-b text-center text-red-600">Tổng Xuất</th>
                  <th className="p-3 border-b text-center font-bold text-teal-700 bg-teal-50">Tồn Đầu KỲ MỚI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeProducts.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">Không có dữ liệu</td></tr>
                ) : (
                  activeProducts.map(p => {
                    const endingStock = getStock(p);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{p.name}</td>
                        <td className="p-3 text-center text-gray-500">{p.initialStock}</td>
                        <td className="p-3 text-center text-blue-600">+{p.totalIn}</td>
                        <td className="p-3 text-center text-red-600">-{p.totalOut}</td>
                        <td className="p-3 text-center font-bold text-teal-700 text-base bg-teal-50/50">
                          {endingStock}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
          {!isForced && onClose && (
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-lg border bg-white font-bold text-gray-600 hover:bg-gray-100 transition shadow-sm"
              disabled={isClosing}
            >
              Hủy bỏ
            </button>
          )}
          <button 
            onClick={handleCloseInventory} 
            disabled={isClosing}
            className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-sm flex items-center gap-2"
          >
            {isClosing ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
              <><i className="fa-solid fa-check-double"></i> {isForced ? 'Chốt tồn & Mở khóa làm việc' : 'Xác nhận Chốt sổ'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
