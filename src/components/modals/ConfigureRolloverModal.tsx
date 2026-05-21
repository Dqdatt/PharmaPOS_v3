import { useState } from 'react';
import { showNotification } from '../../utils/toast';

interface Props {
  onClose: () => void;
}

export default function ConfigureRolloverModal({ onClose }: Props) {
  const currentLockDate = localStorage.getItem('mediPosLockDate') || new Date().toISOString().split('T')[0];
  const currentEnabled = localStorage.getItem('mediPosRolloverEnabled') !== 'false';
  
  const [targetDate, setTargetDate] = useState<string>(currentLockDate);
  const [isEnabled, setIsEnabled] = useState<boolean>(currentEnabled);

  const handleSave = () => {
    if (!targetDate) {
      showNotification('Vui lòng chọn ngày chốt tồn hợp lệ', 'error');
      return;
    }
    localStorage.setItem('mediPosLockDate', targetDate);
    localStorage.setItem('mediPosRolloverEnabled', isEnabled.toString());
    
    // Format for display DD/MM/YYYY
    const [y, m, d] = targetDate.split('-');
    
    if (isEnabled) {
      showNotification(`Đã bật chốt tồn và đặt lịch khóa vào ngày ${d}/${m}/${y}`, 'success');
    } else {
      showNotification('Đã tắt tính năng bắt buộc chốt tồn kho', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-gear text-gray-500"></i> Cấu hình ngày chốt kho
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Hệ thống sẽ tự động khóa và yêu cầu chốt tồn kho từ ngày này mỗi tháng.
        </p>
        
        <div className="mb-6">
          <label className="flex items-center cursor-pointer mb-5">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <div className={`block w-14 h-8 rounded-full transition ${isEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 font-bold text-gray-700">
              Bật yêu cầu chốt tồn kho hàng tháng
            </div>
          </label>

          {isEnabled && (
            <div className="animate-[scaleIn_0.2s_ease-out]">
              <label className="block text-sm font-bold text-gray-700 mb-2">Chọn ngày khóa sổ tiếp theo</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-lg text-teal-700"
              />
              <p className="text-xs text-gray-400 mt-2">
                * Hệ thống sẽ không hiển thị màn hình khóa cho đến khi vượt qua ngày này.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border bg-white font-bold text-gray-600 hover:bg-gray-100 transition shadow-sm"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-sm"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
