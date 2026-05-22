import { useState } from 'react';
import { showNotification } from '../../utils/toast';
import { usePos } from '../../contexts/PosContext';

export default function StaffModal({
  userId,
  onClose,
}: {
  userId: number | null;
  onClose: () => void;
}) {
  const { users, addUserToDB, updateUserInDB } = usePos();
  const user = userId ? users.find(u => u.id === userId) : null;
  const isEditing = !!user;

  const [form, setForm] = useState({
    name: user?.name || '',
    role: user?.role || 'staff' as 'admin' | 'staff',
    pin: user?.pin || '',
  });

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const saveStaff = async () => {
    if (!form.name) { showNotification('Vui lòng nhập họ tên!', 'error'); return; }
    if (form.pin && form.pin.length !== 4) { showNotification('Mã PIN phải đúng 4 số hợp lệ!', 'error'); return; }

    try {
      if (isEditing && user) {
        await updateUserInDB({
          ...user,
          name: form.name,
          role: form.role as 'admin' | 'staff',
          pin: form.pin,
        });
      } else {
        await addUserToDB({
          name: form.name,
          role: form.role as 'admin' | 'staff',
          pin: form.pin,
        });
      }
      onClose();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Có lỗi xảy ra khi lưu nhân viên! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {isEditing ? 'Sửa tài khoản' : 'Thêm tài khoản'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">HỌ VÀ TÊN *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">QUYỀN HẠN</label>
            <select
              value={form.role}
              onChange={e => update('role', e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
            >
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản lý (Admin)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">MÃ PIN ĐĂNG NHẬP (4 số)</label>
            <input
              type="password"
              value={form.pin}
              onChange={e => update('pin', e.target.value)}
              maxLength={4}
              placeholder="Ví dụ: 1234"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-mono tracking-widest text-center"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border bg-white font-bold hover:bg-gray-100 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={saveStaff}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 text-sm"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
