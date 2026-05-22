import { useState, useEffect } from 'react';
import { showNotification } from '../../utils/toast';

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

export interface VietQRConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
}

interface Props {
  onClose: () => void;
}

export default function VietQRConfigModal({ onClose }: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<VietQRConfig>({ bankId: '', accountNo: '', accountName: '' });

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('mediPosVietQRConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse VietQR config:', e);
      }
    }

    // Fetch banks
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => {
        if (data.code === '00') {
          setBanks(data.data);
        }
      })
      .catch(e => {
        showNotification('Lỗi khi tải danh sách ngân hàng!', 'error');
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    if (!config.bankId || !config.accountNo || !config.accountName) {
      showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
      return;
    }
    localStorage.setItem('mediPosVietQRConfig', JSON.stringify(config));
    showNotification('Đã lưu cấu hình thanh toán VietQR!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Cấu hình Ngân hàng (VietQR)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg flex items-start gap-3">
            <i className="fa-solid fa-circle-info mt-1 text-blue-500"></i>
            <div>Cấu hình này dùng để tạo mã QR thanh toán độc lập khi xuất hóa đơn từ tab Xuất kho.</div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
              <div>Đang tải danh sách ngân hàng...</div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngân hàng hưởng thụ</label>
                <select
                  value={config.bankId}
                  onChange={e => setConfig({ ...config, bankId: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="" disabled>-- Chọn ngân hàng --</option>
                  {banks.map(bank => (
                    <option key={bank.bin} value={bank.bin}>
                      {bank.shortName} - {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Số tài khoản</label>
                <input
                  type="text"
                  value={config.accountNo}
                  onChange={e => setConfig({ ...config, accountNo: e.target.value })}
                  placeholder="Ví dụ: 190300000000"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên chủ tài khoản</label>
                <input
                  type="text"
                  value={config.accountName}
                  onChange={e => setConfig({ ...config, accountName: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg border bg-white font-bold text-gray-600 hover:bg-gray-100 transition"
          >
            Đóng
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i> Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
