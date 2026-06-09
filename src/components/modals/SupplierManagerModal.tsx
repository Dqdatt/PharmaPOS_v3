import { useState, useEffect } from 'react';
import { usePos, Supplier } from '../../contexts/PosContext';
import BankAutocomplete from '../BankAutocomplete';

interface Props {
  onClose: () => void;
}

export default function SupplierManagerModal({ onClose }: Props) {
  const { suppliers, addSupplierToDB, updateSupplierInDB, deleteSupplierFromDB } = usePos();
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Supplier Form State
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});
  const [banks, setBanks] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => {
        if (data.code === '00' && data.data) {
          setBanks(data.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveSupplier = async () => {
    if (!supplierForm.name) {
      alert('Vui lòng nhập tên công ty');
      return;
    }
    
    // Auto generate code if missing
    if (!supplierForm.code) {
      supplierForm.code = 'NCC' + Date.now().toString().slice(-4);
    }
    
    try {
      if (supplierForm.id) {
        await updateSupplierInDB(supplierForm as Supplier);
        setIsEditingSupplier(false);
        const updated = suppliers.find(s => s.id === supplierForm.id);
        if (updated) setSelectedSupplier({ ...updated, ...supplierForm });
      } else {
        await addSupplierToDB(supplierForm as Omit<Supplier, 'id'>);
        setIsEditingSupplier(false);
        setSupplierForm({});
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xoá NCC này?')) {
      await deleteSupplierFromDB(id);
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
    }
  };

  // Keep selected supplier updated when suppliers change
  useEffect(() => {
    if (selectedSupplier) {
      const updated = suppliers.find(s => s.id === selectedSupplier.id);
      if (updated) setSelectedSupplier(updated);
      else setSelectedSupplier(null);
    }
  }, [suppliers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-800"><i className="fa-solid fa-truck-field mr-2"></i>Quản lý Nhà cung cấp</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center">
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        {/* BODY: 2 Panes */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Pane: Supplier List */}
          <div className="w-1/3 border-r flex flex-col bg-white">
            <div className="p-4 border-b flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-700">Danh sách NCC</h3>
              <button 
                onClick={() => { setSupplierForm({}); setIsEditingSupplier(true); setSelectedSupplier(null); }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm transition"
              >
                <i className="fa-solid fa-plus mr-1"></i>Thêm
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {suppliers.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => { setSelectedSupplier(s); setIsEditingSupplier(false); }}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition ${selectedSupplier?.id === s.id ? 'bg-teal-50 border-teal-500' : 'hover:bg-gray-50 border-gray-200'}`}
                >
                  <div className="font-bold text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>Mã: {s.code}</span>
                    <span>{s.bankName ? `${s.bankName} - ${s.accountNumber}` : 'Chưa có TK'}</span>
                  </div>
                </div>
              ))}
              {suppliers.length === 0 && <div className="text-center p-4 text-gray-400 text-sm">Chưa có NCC nào</div>}
            </div>
          </div>

          {/* Right Pane: Details & Forms */}
          <div className="w-2/3 flex flex-col bg-gray-50 overflow-y-auto p-6">
            
            {/* NEW / EDIT SUPPLIER FORM */}
            {isEditingSupplier ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4">{supplierForm.id ? 'Sửa NCC' : 'Thêm Nhà cung cấp mới'}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Công ty *</label>
                    <input type="text" value={supplierForm.name || ''} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:border-teal-500" placeholder="VD: Công ty CP Dược phẩm..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
                    <BankAutocomplete
                      banks={banks}
                      value={supplierForm.bankName || ''}
                      onChange={(bankBin) => setSupplierForm({ ...supplierForm, bankName: bankBin })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                    <input type="text" value={supplierForm.accountNumber || ''} onChange={e => setSupplierForm({...supplierForm, accountNumber: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:border-teal-500" placeholder="VD: 123456789" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chủ tài khoản</label>
                    <input type="text" value={supplierForm.accountName || ''} onChange={e => setSupplierForm({...supplierForm, accountName: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:border-teal-500" placeholder="VD: NGUYEN VAN A" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setIsEditingSupplier(false); if (!supplierForm.id) setSelectedSupplier(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">Hủy</button>
                  <button onClick={handleSaveSupplier} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition text-sm">Lưu Nhà cung cấp</button>
                </div>
              </div>
            ) : selectedSupplier ? (
              <div className="space-y-6">
                
                {/* Supplier Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{selectedSupplier.name}</h3>
                      <p className="text-sm text-gray-500">Mã: {selectedSupplier.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSupplierForm(selectedSupplier); setIsEditingSupplier(true); }} className="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition" title="Sửa">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button onClick={() => handleDeleteSupplier(selectedSupplier.id)} className="w-8 h-8 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition" title="Xóa">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Thông tin thanh toán</h4>
                  {selectedSupplier.bankName || selectedSupplier.accountNumber ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                      <div>
                        <span className="block text-xs text-gray-500 font-medium mb-1">NGÂN HÀNG</span>
                        <div className="font-bold text-gray-800">{selectedSupplier.bankName || '-'}</div>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 font-medium mb-1">SỐ TÀI KHOẢN</span>
                        <div className="font-bold text-gray-800 font-mono">{selectedSupplier.accountNumber || '-'}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs text-gray-500 font-medium mb-1">CHỦ TÀI KHOẢN</span>
                        <div className="font-bold text-gray-800 uppercase">{selectedSupplier.accountName || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-sm border border-yellow-200 flex items-center gap-3">
                      <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                      <div>Chưa có thông tin tài khoản ngân hàng. Vui lòng bấm Sửa để cập nhật.</div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                <i className="fa-solid fa-building text-5xl mb-3 opacity-20"></i>
                <p>Chọn một nhà cung cấp bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

