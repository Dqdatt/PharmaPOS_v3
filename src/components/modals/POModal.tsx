import { useState } from 'react';
import { showNotification } from '../../utils/toast';
import { usePos, Purchase } from '../../contexts/PosContext';
import ProductAutocomplete from '../ProductAutocomplete';
import SupplierAutocomplete from '../SupplierAutocomplete';
import { getDbErrorMessage } from '../../utils/dbFallback';

interface PoRow {
  productId: number | '';
  qty: number;
  cost: number;
}

export default function POModal({ onClose, initialData, onSaved }: { onClose: () => void, initialData?: Purchase, onSaved?: (po: Purchase) => void }) {
  const { products, suppliers, addPurchaseToDB, updatePurchaseInDB, formatPrice, getNow } = usePos();

  const [supplierId, setSupplierId] = useState<number | ''>(initialData?.supplierId || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [items, setItems] = useState<PoRow[]>(
    initialData 
      ? initialData.items.map(i => ({ productId: i.productId, qty: i.qty, cost: i.cost }))
      : [{ productId: '', qty: 1, cost: 0 }]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'action' | 'method'>('action');
  const [paymentAction, setPaymentAction] = useState<'pay' | 'debt' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'debt'>('cash');

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

  const handleConfirmClick = () => {
    const validItems = items.filter(i => i.productId !== '' && i.qty > 0);
    if (validItems.length === 0) {
      showNotification('Vui lòng chọn ít nhất 1 sản phẩm hợp lệ!', 'error');
      return;
    }
    setPaymentStep('action');
    setPaymentAction(null);
    setShowPayment(true);
  };

  const savePo = async () => {
    if (isProcessing) return;
    const validItems = items.filter(i => i.productId !== '' && i.qty > 0);
    
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

    const poId = initialData ? initialData.id : 'PN' + Date.now().toString().slice(-6);
    const selectedSupplier = suppliers.find(s => s.id === Number(supplierId));
    
    const status = paymentMethod === 'debt' ? 'DEBT' : 'COMPLETED';
    
    const newPo: Purchase = {
      id: poId,
      date: initialData ? initialData.date : getNow(true),
      supplier: selectedSupplier?.name || 'Khách vãng lai',
      supplierId: selectedSupplier?.id,
      status: status,
      paymentMethod: paymentMethod !== 'debt' ? paymentMethod : undefined,
      debtAt: paymentMethod === 'debt' ? getNow(true) : initialData?.debtAt,
      paidAt: paymentMethod !== 'debt' ? getNow(true) : initialData?.paidAt,
      paymentRequestedAt: initialData?.paymentRequestedAt,
      lockedAt: initialData?.lockedAt,
      note,
      items: enrichedItems,
      total: poTotalCalc,
    };

    // Calculate new stock and import price
    const productsToUpdate = products.map(p => {
      let newTotalIn = p.totalIn;
      // Revert old quantities if editing
      if (initialData) {
        const oldItem = initialData.items.find(i => i.productId === p.id);
        if (oldItem) newTotalIn -= oldItem.qty;
      }
      
      const item = enrichedItems.find(i => i.productId === p.id);
      if (item) {
        newTotalIn += item.qty;
        return { ...p, totalIn: newTotalIn, importPrice: item.cost };
      } else if (initialData && initialData.items.find(i => i.productId === p.id)) {
        // Just reverted
        return { ...p, totalIn: newTotalIn };
      }
      return p;
    });

    setIsProcessing(true);
    try {
      if (initialData) {
        await updatePurchaseInDB(newPo, productsToUpdate);
        showNotification(`Cập nhật phiếu nhập ${poId} thành công!`, 'success');
      } else {
        await addPurchaseToDB(newPo, productsToUpdate);
        showNotification(`Tạo phiếu nhập ${poId} thành công!`, 'success');
      }
      if (onSaved) onSaved(newPo);
      else onClose();
    } catch (e) {
      const errMsg = getDbErrorMessage(e);
      showNotification(`Có lỗi xảy ra khi lưu phiếu nhập! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">{initialData ? `Sửa Phiếu Nhập: ${initialData.id}` : 'Tạo Phiếu Nhập Hàng'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">NHÀ CUNG CẤP</label>
              <SupplierAutocomplete
                suppliers={suppliers}
                value={supplierId}
                onChange={setSupplierId}
                disabled={initialData?.status === 'COMPLETED'}
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

          <div className="border rounded-lg">
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
                      <ProductAutocomplete
                        products={products}
                        value={row.productId}
                        onChange={(val) => updateRow(idx, 'productId', val)}
                      />
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
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 rounded-lg border bg-white font-bold hover:bg-gray-100 text-sm disabled:opacity-50">Hủy</button>
          <button onClick={handleConfirmClick} disabled={isProcessing} className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm disabled:opacity-50">
            {initialData ? 'Lưu thay đổi' : 'Xác nhận nhập hàng'}
          </button>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Thanh toán phiếu nhập</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-1">Tổng số tiền cần thanh toán</div>
                <div className="text-2xl font-bold text-red-600">{formatPrice(poTotalCalc)}</div>
              </div>
              <div className="space-y-2">
                {paymentStep === 'action' ? (
                  <>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Chọn thao tác:</label>
                    <div
                      onClick={() => {
                        setPaymentAction('pay');
                        setPaymentMethod('cash');
                        setPaymentStep('method');
                      }}
                      className="p-3 border rounded-lg cursor-pointer flex justify-between items-center hover:bg-teal-50 hover:border-teal-500 hover:text-teal-700"
                    >
                      <span className="font-bold"><i className="fa-solid fa-circle-dollar-to-slot mr-2"></i>Thanh toán công nợ</span>
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                    <div
                      onClick={() => {
                        setPaymentAction('debt');
                        setPaymentMethod('debt');
                      }}
                      className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${paymentMethod === 'debt' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-gray-50'}`}
                    >
                      <span className="font-bold"><i className="fa-solid fa-clock-rotate-left mr-2"></i>Chuyển công nợ</span>
                      {paymentMethod === 'debt' && <i className="fa-solid fa-circle-check"></i>}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Chọn phương thức thanh toán:</label>
                    <div
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${paymentMethod === 'cash' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'hover:bg-gray-50'}`}
                    >
                      <span className="font-bold"><i className="fa-solid fa-money-bill-wave mr-2"></i>Tiền mặt</span>
                      {paymentMethod === 'cash' && <i className="fa-solid fa-circle-check"></i>}
                    </div>
                    <div
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${paymentMethod === 'transfer' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'hover:bg-gray-50'}`}
                    >
                      <span className="font-bold"><i className="fa-solid fa-money-check-dollar mr-2"></i>Chuyển khoản</span>
                      {paymentMethod === 'transfer' && <i className="fa-solid fa-circle-check"></i>}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => paymentStep === 'method' ? setPaymentStep('action') : setShowPayment(false)}
                className="px-4 py-2 rounded-lg border bg-white font-bold hover:bg-gray-100 text-sm"
              >
                {paymentStep === 'method' ? 'Quay lại' : 'Hủy'}
              </button>
              <button
                onClick={() => { setShowPayment(false); savePo(); }}
                disabled={paymentStep === 'action' && paymentAction !== 'debt'}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentMethod === 'debt' ? 'Chuyển công nợ' : 'Thanh toán thành công'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="p-10 flex flex-col items-center justify-center text-teal-600">
              <i className="fa-solid fa-spinner fa-spin text-5xl mb-4"></i>
              <div className="font-bold text-lg">Đang lưu phiếu nhập...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
