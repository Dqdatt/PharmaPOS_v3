import { useEffect, useState } from 'react';
import { usePos } from '../contexts/PosContext';

interface CustomerState {
  cart: { name: string; price: number; qty: number; unit: string }[];
  total: number;
  paymentMethod: string | null;
  otherCosts: number;
  customerName: string;
}

import { bankInfo, formatQRText } from '../utils/bank';

const getDynamicQRUrl = (amount: number, customerName: string) => {
  const formattedAccountName = encodeURIComponent(formatQRText(bankInfo.accountName));
  const formattedDescription = encodeURIComponent(formatQRText(bankInfo.description));
  const formattedCustomer = encodeURIComponent(formatQRText(customerName || "KHACH HANG"));
  return `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-qr-only.png?amount=${amount}&addInfo=${formattedCustomer}%20${formattedDescription}&accountName=${formattedAccountName}`;
};

export default function CustomerView() {
  const { formatPrice } = usePos();
  const [state, setState] = useState<CustomerState>({
    cart: [],
    total: 0,
    paymentMethod: null,
    otherCosts: 0,
    customerName: '',
  });

  const loadState = () => {
    const raw = localStorage.getItem('mediPosSync');
    if (raw) {
      try {
        setState(JSON.parse(raw));
      } catch {}
    }
  };

  useEffect(() => {
    loadState();
    const handler = (e: StorageEvent) => {
      if (e.key === 'mediPosSync') loadState();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className="h-screen flex bg-white">
      {/* Left: branding + payment */}
      <div className="w-1/2 bg-teal-600 text-white p-10 flex flex-col justify-center items-center">
        <h1 className="text-5xl font-bold mb-4">MediPOS</h1>
        <p className="text-xl opacity-80">Kính chúc Quý khách nhiều sức khỏe!</p>

        {state.paymentMethod === 'transfer' && (
          <div className="mt-12 bg-white text-gray-800 p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-teal-600">Quét mã QR để thanh toán</h3>
            <div className="w-80 h-80 bg-gray-100 border-4 border-teal-600 rounded-lg flex items-center justify-center overflow-hidden p-2 relative">
              {state.total > 0 ? (
                <img 
                  src={getDynamicQRUrl(state.total, state.customerName)} 
                  alt="VietQR Payment" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <i className="fa-solid fa-qrcode text-8xl text-gray-300"></i>
              )}
            </div>
            <p className="mt-4 font-bold text-2xl text-red-600">{formatPrice(state.total)}</p>
          </div>
        )}

        {state.paymentMethod === 'cash' && (
          <div className="mt-12 text-center">
            <i className="fa-solid fa-money-bill-wave text-8xl mb-4 text-green-300"></i>
            <h3 className="text-2xl font-bold">Thanh toán Tiền mặt</h3>
            <p className="text-xl mt-2">Vui lòng thanh toán: {formatPrice(state.total)}</p>
          </div>
        )}
      </div>

      {/* Right: order list */}
      <div className="w-1/2 p-10 flex flex-col">
        <h2 className="text-3xl font-bold border-b pb-4 mb-6">Đơn hàng của bạn</h2>
        <div className="flex-1 overflow-y-auto">
          {state.cart.length === 0 ? (
            <div className="text-gray-400 text-center text-xl mt-10">Chưa có sản phẩm nào</div>
          ) : (
            state.cart.map((item, i) => (
              <div key={i} className="flex justify-between py-4 border-b text-xl">
                <div className="flex-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatPrice(item.price)} x {item.qty} {item.unit}
                  </div>
                </div>
                <div className="font-bold text-teal-700">{formatPrice(item.price * item.qty)}</div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 pt-6 border-t-2 border-gray-800">
          {state.otherCosts > 0 && (
            <div className="flex justify-between items-end mb-2">
              <span className="text-lg text-gray-600">Chi phí khác:</span>
              <span className="text-xl font-bold">{formatPrice(state.otherCosts)}</span>
            </div>
          )}
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold">Tổng thanh toán:</span>
            <span className="text-5xl font-bold text-red-600">{formatPrice(state.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
