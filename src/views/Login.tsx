import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { usePos } from '../contexts/PosContext';
import { createWebLogin, pollWebLogin, getMyProfile } from '../lib/webLogin';
import { showNotification } from '../utils/toast';

interface LoginFeedback {
  message: string;
  action?: 'Tạo mã mới' | 'Thử lại';
}

export default function Login() {
  const { setCurrentUser, addStaffLogToDB, getNow } = usePos();
  const [attempt, setAttempt] = useState(0);
  const [qrUrl, setQrUrl] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loadingText, setLoadingText] = useState('Đang tạo mã QR…');
  const [feedback, setFeedback] = useState<LoginFeedback | null>(null);

  useEffect(() => {
    let active = true;
    let timer: number;
    let expiredCount = 0;

    const clearCode = () => {
      window.clearInterval(timer);
      setQrUrl('');
    };

    const showError = (error: unknown) => {
      clearCode();
      setFeedback({
        message: error instanceof Error ? error.message : 'Không kết nối được máy chủ',
        action: 'Thử lại',
      });
    };

    const renewExpiredCode = () => {
      clearCode();
      expiredCount += 1;
      if (expiredCount >= 5) {
        setFeedback({ message: 'Mã QR đã hết hạn', action: 'Tạo mã mới' });
      } else {
        setFeedback(null);
        void createCode();
      }
    };

    const createCode = async () => {
      setLoadingText('Đang tạo mã QR…');
      try {
        const req = await createWebLogin();
        if (!active) return;
        if (!req.id || !req.secret || !Number.isFinite(req.expiresAt)) {
          throw new Error('Mã đăng nhập không hợp lệ');
        }
        const url = await QRCode.toDataURL(req.qrText, { margin: 1, width: 240 });
        if (!active) return;

        const remaining = () => Math.max(0, Math.ceil((req.expiresAt - Date.now()) / 1000));
        const initialSeconds = remaining();
        if (initialSeconds === 0) {
          renewExpiredCode();
          return;
        }
        setQrUrl(url);
        setSecondsLeft(initialSeconds);

        let polling = false;
        let nextPollAt = Date.now() + 2000;
        timer = window.setInterval(async () => {
          const seconds = remaining();
          setSecondsLeft(seconds);
          if (polling) return;
          if (seconds === 0) {
            renewExpiredCode();
            return;
          }
          if (Date.now() < nextPollAt) return;

          polling = true;
          nextPollAt = Date.now() + 2000;
          try {
            const status = await pollWebLogin(req);
            if (!active || status === 'pending') return;
            if (status === 'expired') {
              renewExpiredCode();
              return;
            }

            clearCode();
            if (status === 'rejected') {
              setFeedback({ message: 'Đã bị từ chối trên điện thoại', action: 'Tạo mã mới' });
              return;
            }
            if (status !== 'approved') throw new Error('Trạng thái đăng nhập không hợp lệ');

            setFeedback(null);
            setLoadingText('Đang kiểm tra tài khoản…');
            const me = await getMyProfile();
            if (!active) return;
            if (!me) {
              setFeedback({ message: 'Tài khoản không được dùng POS' });
              expiredCount = 0;
              void createCode();
              return;
            }

            try {
              await addStaffLogToDB({
                userId: me.id,
                name: me.name,
                role: me.role,
                loginTime: getNow(true),
                logoutTime: null,
              });
              if (active) {
                const name = me.name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                showNotification(`Xin chào ${name} · Ca làm việc bắt đầu!`, 'success');
              }
            } catch (e) {
              if (active) {
                showNotification('Lỗi khi ghi nhận đăng nhập!', 'error');
                console.error('Failed to log login:', e);
              }
            }
            if (active) setCurrentUser({ id: me.id, name: me.name, role: me.role, pin: '' });
          } catch (e) {
            if (active) showError(e);
          } finally {
            polling = false;
          }
        }, 250);
      } catch (e) {
        if (active) showError(e);
      }
    };

    const start = window.setTimeout(createCode, 0);
    return () => {
      active = false;
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [attempt, setCurrentUser, addStaffLogToDB, getNow]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        <div className="bg-teal-600 p-6 md:p-10 text-white flex flex-col justify-center w-full md:w-1/2">
          <i className="fa-solid fa-notes-medical text-5xl mb-4" aria-hidden="true"></i>
          <h1 className="text-4xl font-bold mb-4">MediPOS</h1>
          <ol className="list-decimal list-inside space-y-2 text-teal-100">
            <li>Mở app MediPOS trên điện thoại</li>
            <li>Bấm nút quét và quét mã QR</li>
            <li>Xác nhận bằng Face ID</li>
          </ol>
        </div>

        <div className="p-6 md:p-10 w-full md:w-1/2 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">Đăng nhập bằng QR</h2>
          <div className="w-60 h-60 flex flex-col items-center justify-center gap-4">
            {qrUrl && secondsLeft > 0 ? (
              <img src={qrUrl} width={240} height={240} alt="Mã QR đăng nhập MediPOS" />
            ) : feedback?.action ? (
              <>
                <p role="alert" className="text-red-600 font-semibold">{feedback.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setLoadingText('Đang tạo mã QR…');
                    setAttempt(prev => prev + 1);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                  {feedback.action}
                </button>
              </>
            ) : (
              <div role="status" className="text-gray-500">
                <div className="mx-auto mb-3 w-8 h-8 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" aria-hidden="true"></div>
                {qrUrl ? 'Đang kiểm tra mã QR…' : loadingText}
              </div>
            )}
          </div>
          <div className="mt-3 min-h-12 text-sm">
            {qrUrl && secondsLeft > 0 && (
              <p className="text-gray-600 tabular-nums">Mã hết hạn sau {secondsLeft} giây</p>
            )}
            {feedback && !feedback.action && (
              <p role="alert" className="text-red-600 font-semibold">{feedback.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
