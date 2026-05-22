import { useState, useEffect } from 'react';
import { usePos, ExportOrder } from '../../contexts/PosContext';
import { VietQRConfig } from './VietQRConfigModal';
import { showNotification } from '../../utils/toast';

interface Props {
  order: ExportOrder;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ExportDetailModal({ order, onClose, onEdit }: Props) {
  const { formatPrice } = usePos();
  const [vietQRConfig, setVietQRConfig] = useState<VietQRConfig | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('mediPosVietQRConfig');
    if (savedConfig) {
      try {
        setVietQRConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Format account name for VietQR: no spaces, no special chars, uppercase
  const formatQRText = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase();
  };

  const getStatusText = (status: ExportOrder['status']) => {
    switch (status) {
      case 'exported': return { text: 'Đã xuất kho', color: 'bg-blue-100 text-blue-700' };
      case 'sent': return { text: 'Đã gửi hàng', color: 'bg-indigo-100 text-indigo-700' };
      case 'received': return { text: 'Khách đã nhận', color: 'bg-teal-100 text-teal-700' };
      case 'pending_payment': return { text: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700' };
      case 'paid': return { text: 'Đã thanh toán', color: 'bg-green-100 text-green-700' };
      case 'returned': return { text: 'Hoàn đơn', color: 'bg-red-100 text-red-700' };
      default: return { text: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusInfo = getStatusText(order.status);
  const showQR = order.status !== 'paid' && order.status !== 'returned' && vietQRConfig;

  let qrUrl = '';
  if (showQR && vietQRConfig) {
    const addInfoStr = formatQRText(`${order.id} ${order.recipientName}`.substring(0, 50)).replace(/\s+/g, " ").trim();
    qrUrl = `https://img.vietqr.io/image/${vietQRConfig.bankId}-${vietQRConfig.accountNo}-qr_only.png?amount=${order.total}&addInfo=${encodeURIComponent(addInfoStr)}&accountName=${encodeURIComponent(vietQRConfig.accountName)}`;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #export-print-area, #export-print-area * { visibility: visible; color: black !important; }
          #export-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20mm; background: white !important; }
          #export-print-area table { border-collapse: collapse !important; border: 1px solid black !important; }
          #export-print-area th, #export-print-area td { border: 1px solid black !important; }
          .no-print { display: none !important; }
        `}
      </style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-gray-800">
              Chi tiết Đơn Xuất Kho {order.id}
            </h3>
            {onEdit && order.status !== 'returned' && (
              <button 
                onClick={onEdit} 
                className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-lg text-sm font-bold transition flex items-center gap-1 border border-yellow-300"
              >
                <i className="fa-solid fa-pen"></i> Sửa
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Main content - printable */}
          <div id="export-print-area" className="flex-1 p-6 print:px-10 print:py-8">
            <div className="hidden print:block text-center mb-8">
              <h1 className="font-bold text-3xl uppercase">Phiếu Xuất Kho</h1>
              <p className="text-gray-600 mt-2">Mã phiếu: <span className="font-bold">{order.id}</span></p>
            </div>

            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 mb-6 print:bg-transparent print:border-none print:p-0 print:mb-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-x-10 md:gap-x-16 gap-y-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Người nhận</div>
                  <div className="font-bold text-gray-900 text-base whitespace-nowrap">{order.recipientName}</div>
                </div>
                {order.recipientPhone && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">SĐT</div>
                    <div className="font-medium text-gray-800 text-sm whitespace-nowrap">
                      <i className="fa-solid fa-phone mr-1.5 opacity-70 text-gray-500 text-xs"></i>
                      {order.recipientPhone}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ngày xuất</div>
                  <div className="font-medium text-gray-800 text-sm whitespace-nowrap">{order.date}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Trạng thái</div>
                  <div className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap print:border print:border-gray-800 print:text-black print:bg-transparent ${statusInfo.color}`}>
                    {statusInfo.text}
                  </div>
                </div>
              </div>
              {order.note && (
                <div className="mt-3 pt-3 border-t border-gray-100 print:border-none print:pt-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ghi chú</div>
                  <div className="text-gray-700 text-sm">{order.note}</div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-x-auto print:border-black print:rounded-none">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 print:bg-transparent print:text-black print:border-b print:border-black">
                  <tr>
                    <th className="py-2.5 px-4 font-bold border-b border-gray-200 text-center w-12 print:border-black">STT</th>
                    <th className="py-2.5 px-4 font-bold border-b border-gray-200 print:border-black">Sản phẩm</th>
                    <th className="py-2.5 px-4 font-bold border-b border-gray-200 text-center w-16 print:border-black">SL</th>
                    <th className="py-2.5 px-4 font-bold border-b border-gray-200 text-right w-28 whitespace-nowrap print:border-black">Đơn giá</th>
                    <th className="py-2.5 px-4 font-bold border-b border-gray-200 text-right w-32 whitespace-nowrap print:border-black">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-black">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 px-4 text-center text-[13px] text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-4">
                        <div className="text-[13px] font-medium text-gray-800 whitespace-nowrap">
                          {item.name} <span className="text-gray-500 font-normal ml-1">({item.unit})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center text-[13px] font-medium text-gray-800">{item.qty}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[13px] text-gray-600 whitespace-nowrap">{formatPrice(item.price)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[13px] font-medium text-teal-700 whitespace-nowrap">{formatPrice(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 print:bg-transparent border-t border-gray-200 print:border-black">
                    <td colSpan={4} className="py-3 px-4 text-right text-[13px] font-bold text-gray-700">TỔNG CỘNG:</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-base text-red-600 whitespace-nowrap">{formatPrice(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="hidden print:flex mt-12 justify-between px-10">
              <div className="text-center">
                <p className="font-bold text-gray-800">Người lập phiếu</p>
                <p className="text-sm text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
                <p className="font-bold mt-16">{order.employeeName}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">Người nhận</p>
                <p className="text-sm text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p>
              </div>
            </div>
          </div>

          {/* Sidebar - QR Code */}
          {showQR && (
            <div className="w-full md:w-80 bg-blue-50 border-l border-blue-100 p-6 flex flex-col items-center justify-center no-print shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 w-full mb-4">
                <h4 className="text-center font-bold text-blue-800 mb-2 uppercase text-sm flex items-center justify-center gap-2">
                  <i className="fa-solid fa-qrcode"></i> Thanh Toán VietQR
                </h4>
                <div className="bg-gray-100 rounded-xl overflow-hidden mb-3 aspect-square w-full relative">
                  <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" />
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                  Quét mã qua ứng dụng ngân hàng để thanh toán nhanh
                </div>
              </div>
            </div>
          )}
          {!showQR && order.status !== 'returned' && order.status !== 'paid' && !vietQRConfig && (
            <div className="w-full md:w-80 bg-yellow-50 border-l border-yellow-100 p-6 flex flex-col items-center justify-center no-print shrink-0 text-center">
              <i className="fa-solid fa-triangle-exclamation text-4xl text-yellow-500 mb-3"></i>
              <h4 className="font-bold text-yellow-800 mb-2">Chưa cấu hình VietQR</h4>
              <p className="text-sm text-yellow-700">Vui lòng cấu hình ngân hàng hưởng thụ để hiển thị mã QR thanh toán cho khách hàng.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 no-print shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border bg-white font-bold text-gray-600 hover:bg-gray-100 transition">
            Đóng
          </button>
          <button onClick={handlePrint} className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition flex items-center gap-2 shadow-sm">
            <i className="fa-solid fa-print"></i> In phiếu xuất
          </button>
        </div>
      </div>
    </div>
  );
}
