import { useState, useEffect } from 'react';
import { usePos } from '../contexts/PosContext';
import { showNotification } from '../utils/toast';

export default function Login() {
  const { users, setCurrentUser, addStaffLogToDB, getNow } = usePos();
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');



  const addPin = (num: number) => {
    if (pinInput.length < 4) setPinInput(prev => prev + num);
  };

  const clearPin = () => {
    setPinInput(prev => prev.slice(0, -1));
    setLoginError('');
  };

  const login = async () => {
    if (!selectedUser) return;
    if (pinInput === selectedUser.pin || !selectedUser.pin) {
      setCurrentUser(selectedUser);
      try {
        await addStaffLogToDB({
          userId: selectedUser.id,
          name: selectedUser.name,
          role: selectedUser.role,
          loginTime: getNow(true),
          logoutTime: null,
        });
        showNotification(`Xin chào ${selectedUser.name} · Ca làm việc bắt đầu!`, 'success');
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        showNotification(`Lỗi khi ghi nhận đăng nhập! Chi tiết: ${errMsg}`, 'error');
        console.error('Failed to log login:', e);
      }
      setPinInput('');
      setSelectedUser(null);
    } else {
      setLoginError('Mã PIN không đúng!');
      setPinInput('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedUser) return;
      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 4) setPinInput(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setPinInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        login();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pinInput, login]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        {/* Left: user selection */}
        <div className="bg-teal-600 p-10 text-white flex flex-col justify-center w-full md:w-1/2">
          <i className="fa-solid fa-notes-medical text-6xl mb-6"></i>
          <h1 className="text-4xl font-bold mb-2">MediPOS System</h1>
          <p className="text-teal-100 mb-6">Chọn nhân viên và nhập PIN để bắt đầu</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={[
                  'p-3 rounded-lg border-2 cursor-pointer transition text-center',
                  selectedUser?.id === u.id
                    ? 'border-white bg-teal-700'
                    : 'border-teal-500 bg-teal-500 hover:bg-teal-700',
                ].join(' ')}
              >
                <div className="font-bold">{u.name}</div>
                <div className="text-xs opacity-75">{u.role === 'admin' ? 'Quản lý' : 'Nhân viên'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: PIN pad */}
        <div className="p-10 w-full md:w-1/2 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-700">
            {selectedUser ? `Mã PIN của ${selectedUser.name}` : 'Vui lòng chọn nhân viên'}
          </h2>

          {/* PIN dots */}
          <div className="flex gap-4 mb-8">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center text-2xl"
              >
                {pinInput.length >= n ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div
            className={[
              'grid grid-cols-3 gap-4 w-full max-w-xs',
              !selectedUser ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => addPin(n)}
                className="bg-gray-100 hover:bg-teal-100 active:bg-teal-200 p-4 rounded-xl text-2xl font-bold transition touch-manipulation"
              >
                {n}
              </button>
            ))}
            <button
              onClick={clearPin}
              className="bg-red-100 hover:bg-red-200 text-red-600 p-4 rounded-xl font-bold transition touch-manipulation"
            >
              <i className="fa-solid fa-delete-left"></i>
            </button>
            <button
              onClick={() => addPin(0)}
              className="bg-gray-100 hover:bg-teal-100 active:bg-teal-200 p-4 rounded-xl text-2xl font-bold transition touch-manipulation"
            >
              0
            </button>
            <button
              onClick={login}
              className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-xl font-bold transition touch-manipulation"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
            </button>
          </div>

          {loginError && (
            <div className="text-red-500 mt-4 font-semibold">{loginError}</div>
          )}
        </div>
      </div>
    </div>
  );
}
