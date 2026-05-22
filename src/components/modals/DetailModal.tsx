import { usePos, Purchase, Invoice } from '../../contexts/PosContext';

interface Props {
  type: 'PO' | 'INV';
  data: Purchase | Invoice;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DetailModal({ type, data, onClose, onEdit }: Props) {
  const { formatPrice } = usePos();

  const isPO = type === 'PO';
  const po = isPO ? (data as Purchase) : null;
  const inv = !isPO ? (data as Invoice) : null;

  const items = isPO
    ? (data as Purchase).items.map(i => ({ name: i.name, unit: i.unit, qty: i.qty, price: i.cost }))
    : (data as Invoice).items.map(i => ({ name: i.name, unit: i.unit, qty: i.qty, price: i.price }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-gray-800">
              {isPO ? 'Chi tiết Phiếu Nhập' : 'Chi tiết Hóa Đơn'} {data.id}
            </h3>
            {isPO && onEdit && (
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

        <div className="p-5 text-sm">
          {isPO && po ? (
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border">
              <div><span className="text-gray-500 text-xs font-bold block">NHÀ CUNG CẤP</span>{po.supplier || '—'}</div>
              <div><span className="text-gray-500 text-xs font-bold block">NGÀY TẠO</span>{po.date}</div>
              <div className="col-span-2"><span className="text-gray-500 text-xs font-bold block">GHI CHÚ</span>{po.note || '—'}</div>
            </div>
          ) : inv ? (
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border">
              <div>
                <span className="text-gray-500 text-xs font-bold block">KHÁCH HÀNG</span>
                {inv.customer.name}{inv.customer.phone ? ` - ${inv.customer.phone}` : ''}
              </div>
              <div><span className="text-gray-500 text-xs font-bold block">THỜI GIAN</span>{inv.time}</div>
              <div><span className="text-gray-500 text-xs font-bold block">NHÂN VIÊN</span>{inv.employeeName}</div>
              <div>
                <span className="text-gray-500 text-xs font-bold block">THANH TOÁN</span>
                {inv.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
              </div>
            </div>
          ) : null}

          <table className="w-full text-left border">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="p-2 border-b">Sản phẩm</th>
                <th className="p-2 border-b text-center">SL</th>
                <th className="p-2 border-b text-right">Đơn giá</th>
                <th className="p-2 border-b text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{item.name}<br /><span className="text-xs text-gray-500">{item.unit}</span></td>
                  <td className="p-2 text-center font-bold">{item.qty}</td>
                  <td className="p-2 text-right font-mono">{formatPrice(item.price)}</td>
                  <td className="p-2 text-right font-mono font-bold">{formatPrice(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isPO && inv && inv.otherCosts > 0 && (
            <div className="flex justify-between items-center mt-2 text-gray-600">
              <span>Chi phí khác:</span>
              <span className="font-mono">{formatPrice(inv.otherCosts)}</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t-2">
            <span className="font-bold text-lg">TỔNG CỘNG:</span>
            <span className="font-bold text-2xl text-red-600 font-mono">{formatPrice(data.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
