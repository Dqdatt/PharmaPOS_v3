import { usePos } from '../../contexts/PosContext';

interface ExportCKModalProps {
  onClose: () => void;
}

export default function ExportCKModal({ onClose }: ExportCKModalProps) {
  const { invoices, formatPrice } = usePos();

  const parseInvDateToISO = (timeStr: string) => {
    const parts = timeStr.split(/[\s,]+/); 
    const dateStr = parts.find(p => p.includes('/'));
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const exportOrders = invoices.filter(inv => 
    inv.method === 'transfer' && inv.status !== 'deleted' && parseInvDateToISO(inv.time) === todayISO
  );

  const totalAmount = exportOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20mm; background: white; }
          .no-print { display: none !important; }
        `}
      </style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-[scaleIn_0.2s_ease-out]">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 no-print shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-money-check-dollar text-teal-600"></i>
            Hóa Đơn Chuyển Khoản Trong Ngày
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* VÙNG IN BẮT ĐẦU */}
        <div id="print-area" className="p-6 print:px-10 print:py-8 flex-1 overflow-y-auto">
          <h2 className="hidden print:block text-center font-bold text-2xl mb-4 uppercase">
            {`Danh sách chuyển khoản ngày ${new Date().toLocaleDateString("vi-VN")}`}
          </h2>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-transparent">
                <th className="px-4 py-3 font-bold text-gray-600 print:text-black uppercase w-12 text-center print:border-b">STT</th>
                <th className="px-4 py-3 font-bold text-gray-600 print:text-black uppercase print:border-b">Thời gian</th>
                <th className="px-4 py-3 font-bold text-gray-600 print:text-black uppercase print:border-b">Khách hàng</th>
                <th className="px-4 py-3 font-bold text-gray-600 print:text-black uppercase text-right print:border-b">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {exportOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 italic">
                    Không có hóa đơn chuyển khoản nào trong ngày hôm nay
                  </td>
                </tr>
              ) : (
                exportOrders.map((o, i) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-gray-500 font-medium print:text-black">{i + 1}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium print:text-black">
                      {o.time.split(',')[1]?.trim() || o.time}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800 print:text-black uppercase">
                      {o.customer.name || "Khách lẻ"}
                    </td>
                    <td className="px-4 py-3 font-bold text-teal-600 print:text-black text-right font-mono">
                      {formatPrice(o.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 print:bg-transparent border-t-2 border-gray-200">
                <td colSpan={3} className="px-4 py-4 font-bold text-gray-800 uppercase text-right">
                  Tổng cộng:
                </td>
                <td className="px-4 py-4 font-bold text-red-600 print:text-black text-right text-lg font-mono">
                  {formatPrice(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* VÙNG IN KẾT THÚC */}

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t shrink-0 no-print">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition"
          >
            Đóng
          </button>
          <button
            onClick={() => window.print()}
            disabled={exportOrders.length === 0}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-print"></i> In Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
}
