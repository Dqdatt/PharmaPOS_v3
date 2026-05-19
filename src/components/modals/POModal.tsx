import { useState } from 'react';
import { showNotification } from '../../utils/toast';
import { usePos } from '../../contexts/PosContext';

interface PoRow {
  productId: number | '';
  qty: number;
  cost: number;
}

export default function POModal({ onClose }: { onClose: () => void }) {
  const { products, addPurchaseToDB, formatPrice, getNow } = usePos();

  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<PoRow[]>([{ productId: '', qty: 1, cost: 0 }]);

  const addRow = () => setItems(prev => [...prev, { productId: '', qty: 1, cost: 0 }]);

  const removeRow = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof PoRow, value: string | number) => {
    setItems(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'productId') {
        const p = products.find(x => x.id === Number(value));
        return { ...row, productId: Number(value), cost: p ? p.importPrice : 0 };
      }
      return { ...row, [field]: Number(value) || 0 };
    }));
  };

  const poTotalCalc = items.reduce((s, i) => s + (i.qty || 0) * (i.cost || 0), 0);

  const savePo = async () => {
    const validItems = items.filter(i => i.productId !== '' && i.qty > 0);
    if (validItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất 1 sản phẩm hợp lệ!', 'error');
      return;
    }

    const enrichedItems = validItems.map(i => {
      const p = products.find(x => x.id === i.productId);
      return {
        productId: i.productId as number,
        name: p?.name || '',
        unit: p?.unit || '',
        qty: i.qty,
        cost: i.cost,
      };
    });

    const poId = 'PN' + Date.now().toString().slice(-6);
    const newPo = {
      id: poId,
      date: getNow(true),
      supplier: supplier || 'Khách vãng lai',
      note,
      items: enrichedItems,
      total: poTotalCalc,
    };

    // Calculate new stock and import price
    const productsToUpdate = products.map(p => {
      const item = enrichedItems.find(i => i.productId === p.id);
      if (item) return { ...p, totalIn: p.totalIn + item.qty, importPrice: item.cost };
      return p;
    });

    try {
      await addPurchaseToDB(newPo, productsToUpdate);
      showNotification(`Tạo phiếu nhập ${poId} thành công!`, 'success');
      onClose();
    } catch (e) {
      showNotification('Có lỗi xảy ra khi lưu phiếu nhập!', 'error');
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Tạo Phiếu Nhập Hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NHÀ CUNG CẤP</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">GHI CHÚ</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-xs font-bold flex justify-between items-center">
              <span>CHI TIẾT HÀNG NHẬP</span>
              <button
                onClick={addRow}
                className="bg-white border px-2 py-1 rounded text-teal-600 hover:bg-teal-50 text-xs font-bold"
              >
                <i className="fa-solid fa-plus mr-1"></i>Thêm dòng
              </button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="p-2 w-5/12">Sản phẩm</th>
                  <th className="p-2 w-2/12 text-center">SL</th>
                  <th className="p-2 w-2/12 text-right">Giá nhập</th>
                  <th className="p-2 w-2/12 text-right">Thành tiền</th>
                  <th className="p-2 w-1/12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      <select
                        value={row.productId}
                        onChange={e => updateRow(idx, 'productId', e.target.value)}
                        className="w-full p-1 border rounded text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="" disabled>-- Chọn --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.qty}
                        min={1}
                        onChange={e => updateRow(idx, 'qty', e.target.value)}
                        className="w-full p-1 border rounded text-xs text-center focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.cost}
                        min={0}
                        onChange={e => updateRow(idx, 'cost', e.target.value)}
                        className="w-full p-1 border rounded text-xs text-right font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-teal-700">
                      {formatPrice(row.qty * row.cost)}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 p-3 text-right text-sm">
              <span className="font-bold mr-4">Tổng tiền nhập:</span>
              <span className="text-xl font-bold text-red-600 font-mono">{formatPrice(poTotalCalc)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-white font-bold hover:bg-gray-100 text-sm">Hủy</button>
          <button onClick={savePo} className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm">Xác nhận nhập hàng</button>
        </div>
      </div>
    </div>
  );
}
