import { useState } from 'react';
import { showNotification } from '../../utils/toast';
import { usePos } from '../../contexts/PosContext';

export default function ProductModal({
  productId,
  onClose,
}: {
  productId: number | null;
  onClose: () => void;
}) {
  const { products, addProductToDB, updateProductInDB } = usePos();
  const product = productId ? products.find(p => p.id === productId) : null;
  const isEditing = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    unit: product?.unit || '',
    category: product?.category || 'Thuốc',
    importPrice: product ? product.importPrice : '',
    sellPrice: product ? product.sellPrice : '',
    initialStock: product ? product.initialStock : '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const update = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const saveProduct = async () => {
    if (isProcessing) return;
    if (!form.name || !form.unit || !form.sellPrice) {
      showNotification('Vui lòng điền đủ thông tin bắt buộc (*)', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      if (isEditing && product) {
        await updateProductInDB({
          ...product,
          name: form.name,
          unit: form.unit,
          category: form.category,
          importPrice: Number(form.importPrice),
          sellPrice: Number(form.sellPrice),
          initialStock: Number(form.initialStock),
        });
        showNotification('Cập nhật sản phẩm thành công!', 'success');
      } else {
        await addProductToDB({
          name: form.name,
          unit: form.unit,
          category: form.category,
          importPrice: Number(form.importPrice),
          sellPrice: Number(form.sellPrice),
          initialStock: Number(form.initialStock),
          totalIn: 0,
          totalOut: 0,
        });
        showNotification('Thêm sản phẩm thành công!', 'success');
      }
      onClose();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Có lỗi xảy ra khi lưu sản phẩm! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tên sản phẩm *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Đơn vị tính *</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => update('unit', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Danh mục</label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
              >
                <option>Thuốc</option>
                <option>Vật tư y tế</option>
                <option>Thiết bị</option>
                <option>Thực phẩm bổ sung</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tồn đầu kỳ</label>
              <input
                type="number"
                placeholder="0"
                value={form.initialStock}
                onChange={e => update('initialStock', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá nhập (₫)</label>
              <input
                type="number"
                placeholder="0"
                value={form.importPrice}
                onChange={e => update('importPrice', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá bán (₫) *</label>
              <input
                type="number"
                placeholder="0"
                value={form.sellPrice}
                onChange={e => update('sellPrice', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg border bg-white text-gray-600 font-bold hover:bg-gray-100 text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={saveProduct}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm disabled:opacity-50"
          >
            Lưu sản phẩm
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="p-10 flex flex-col items-center justify-center text-teal-600">
              <i className="fa-solid fa-spinner fa-spin text-5xl mb-4"></i>
              <div className="font-bold text-lg">Đang lưu sản phẩm...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
