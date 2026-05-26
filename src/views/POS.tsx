import { useState, useEffect, useRef } from 'react';
import { usePos } from '../contexts/PosContext';
import ProductModal from '../components/modals/ProductModal';
import POModal from '../components/modals/POModal';
import DetailModal from '../components/modals/DetailModal';
import { showNotification } from '../utils/toast';
import { docTienBangChu } from '../utils/numberToWords';
import mqtt from 'mqtt';
import { bankInfo, formatQRText } from '../utils/bank';

let globalMqttClient: mqtt.MqttClient | null = null;
let isMqttConnecting = false;

export default function POS({ onOpenCustomerScreen }: { onOpenCustomerScreen: () => void }) {
  const {
    products, cart, setCart, addInvoiceToDB,
    getStock, formatPrice, getNow, currentUser,
  } = usePos();

  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posCustomer, setPosCustomer] = useState({ name: '', phone: '' });
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [isOtherCostOnly, setIsOtherCostOnly] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(globalMqttClient);

  const DEVICE_ID = "device001";
  const mqtt_topic = `qr/${DEVICE_ID}`;

  useEffect(() => {
    if (!globalMqttClient && !isMqttConnecting) {
      isMqttConnecting = true;
      const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");
      client.on("connect", () => {
        console.log("MQTT Connected");
        globalMqttClient = client;
        setMqttClient(client);
        isMqttConnecting = false;
      });
      client.on("reconnect", () => console.log("MQTT Reconnecting..."));
      client.on("error", (err) => {
        console.log("MQTT Error:", err);
        isMqttConnecting = false;
      });
    } else if (globalMqttClient) {
      setMqttClient(globalMqttClient);
    }
  }, []);

  const filteredPosProducts = products
    .filter(p => p.name.toLowerCase().includes(posSearchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addToCart = (product: typeof products[0]) => {
    const s = getStock(product);
    if (s <= 0) { showNotification('Sản phẩm đã hết hàng!', 'error'); return; }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= s) { showNotification('Không đủ tồn kho!', 'error'); return; }
      setCart(prev => prev.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x));
    } else {
      setCart(prev => [...prev, { id: product.id, name: product.name, unit: product.unit, price: product.sellPrice, qty: 1 }]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const item = cart[index];
    const p = products.find(x => x.id === item.id);
    const newQty = (Number(item.qty) || 0) + delta;
    if (newQty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else if (p && newQty > getStock(p)) {
      showNotification('Không đủ tồn kho!', 'error');
    } else {
      setCart(prev => prev.map((x, i) => i === index ? { ...x, qty: newQty } : x));
    }
  };

  const setQtyDirectly = (index: number, val: string | number) => {
    if (val === '') {
      setCart(prev => prev.map((x, i) => i === index ? { ...x, qty: '' as any } : x));
      return;
    }
    const newQty = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(newQty)) return;

    const item = cart[index];
    const p = products.find(x => x.id === item.id);
    
    if (newQty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
    } else if (p && newQty > getStock(p)) {
      showNotification('Không đủ tồn kho!', 'error');
      setCart(prev => prev.map((x, i) => i === index ? { ...x, qty: getStock(p) } : x));
    } else {
      setCart(prev => prev.map((x, i) => i === index ? { ...x, qty: newQty } : x));
    }
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const cartTotalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const cartTotalBase = cart.reduce((sum, item) => sum + item.price * (Number(item.qty) || 0), 0);
  const finalTotal = cartTotalBase + (Number(otherCosts) || 0);
  const canCheckout = (cart.length > 0 || isOtherCostOnly) && paymentMethod !== null;

  const qrShownRef = useRef(false);

  useEffect(() => {
    if (paymentMethod === 'transfer' && finalTotal > 0) {
      const timer = setTimeout(async () => {
        if (!mqttClient || !mqttClient.connected) return;
        const safeName = posCustomer.name.trim() || "KHACH LE";
        const addInfoStr = `${formatQRText(safeName)} ${formatQRText(bankInfo.description)}`.replace(/\s+/g, " ").trim();
        try {
          const response = await fetch("https://api.vietqr.io/v2/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountNo: bankInfo.accountNo,
              accountName: bankInfo.accountName,
              acqId: bankInfo.bankId,
              amount: finalTotal.toString(),
              addInfo: addInfoStr,
              format: "text",
              template: "compact2",
            }),
          });
          const data = await response.json();
          let qrString = "";
          if (data && data.code === "00") {
            qrString = data.data.qrCode;
          }
          const payload = {
            type: "pay",
            amount: finalTotal.toString(),
            addInfo: addInfoStr,
            accountNo: bankInfo.accountNo,
            accountName: bankInfo.accountName,
            acqId: bankInfo.bankId,
            qrText: qrString,
          };
          qrShownRef.current = true;
          mqttClient.publish(mqtt_topic, JSON.stringify(payload), { qos: 1 });
          console.log("Đã gửi lệnh thanh toán qua MQTT thành công!");
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          showNotification(`Lỗi tạo chuỗi QR! Chi tiết: ${errMsg}`, 'error');
          console.error("Lỗi tạo chuỗi QR:", error);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      if (qrShownRef.current && mqttClient && mqttClient.connected) {
        mqttClient.publish(mqtt_topic, JSON.stringify({ type: "cancel" }));
        qrShownRef.current = false;
      }
    }
  }, [paymentMethod, finalTotal, posCustomer.name, mqttClient, mqtt_topic]);

  // Sync to customer view
  useEffect(() => {
    const state = {
      cart,
      total: finalTotal,
      otherCosts: Number(otherCosts) || 0,
      paymentMethod,
      customerName: posCustomer.name || '',
    };
    localStorage.setItem('mediPosSync', JSON.stringify(state));
  }, [cart, finalTotal, otherCosts, paymentMethod, posCustomer.name]);

  const handleCheckoutSubmit = async (shouldPrint: boolean) => {
    if (!canCheckout || !currentUser || isProcessing) return;
    setIsProcessing(true);
    const inv = {
      id: 'HD' + Date.now().toString().slice(-6),
      time: getNow(true),
      employeeName: currentUser.name,
      employeeId: currentUser.id,
      customer: { name: posCustomer.name || 'Khách lẻ', phone: posCustomer.phone },
      items: JSON.parse(JSON.stringify(cart)),
      method: paymentMethod!,
      otherCosts: Number(otherCosts) || 0,
      total: finalTotal,
    };
    
    const productsToUpdate = products.map(p => {
      const ci = cart.find(x => x.id === p.id);
      if (ci) return { ...p, totalOut: p.totalOut + ci.qty };
      return p;
    });

    try {
      await addInvoiceToDB(inv, productsToUpdate);
      showNotification(`Thanh toán thành công đơn ${inv.id}`, 'success');
      
      if (shouldPrint) {
        setPrintData({
          customerName: posCustomer.name || 'Khách lẻ',
          cart: [...cart],
          totalAmount: finalTotal,
          date: {
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        });
        setTimeout(() => {
          window.print();
          resetCart();
        }, 300);
      } else {
        resetCart();
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Có lỗi xảy ra khi lưu hóa đơn! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
    } finally {
      setIsProcessing(false);
      setShowPrintConfirm(false);
    }
  };

  const resetCart = () => {
    setCart([]);
    setOtherCosts(0);
    setIsOtherCostOnly(false);
    setPaymentMethod(null);
    setPosCustomer({ name: '', phone: '' });
    setPrintData(null);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      {/* Product grid */}
      <div className="w-full md:w-7/12 lg:w-2/3 p-4 flex flex-col h-1/2 md:h-full">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              value={posSearchQuery}
              onChange={e => setPosSearchQuery(e.target.value)}
              placeholder="Tìm sản phẩm y tế..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm text-lg bg-white"
            />
          </div>
          <button
            onClick={onOpenCustomerScreen}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl shadow-sm font-bold transition whitespace-nowrap"
          >
            <i className="fa-solid fa-tv mr-2"></i>Màn Khách Hàng
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4 content-start">
          {filteredPosProducts.map(product => {
            const s = getStock(product);
            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={[
                  'bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:border-teal-500 hover:shadow-md transition flex flex-col justify-between relative touch-manipulation',
                  s <= 0 ? 'opacity-50 border-red-300' : 'border-gray-200 active:bg-gray-50',
                ].join(' ')}
              >
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight mb-1">{product.name}</h3>
                  <span className="text-xs text-gray-500">{product.category} · {product.unit}</span>
                </div>
                <div className="mt-4 flex justify-between items-end">
                  <span className={`text-xs font-semibold ${s <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                    Tồn: {s}
                  </span>
                  <span className="text-teal-700 font-bold text-lg font-mono">{formatPrice(product.sellPrice)}</span>
                </div>
                {s <= 0 && (
                  <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">
                    Hết hàng
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full md:w-5/12 lg:w-1/3 bg-white border-l shadow-xl flex flex-col h-1/2 md:h-full z-10">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center text-sm">
          <div className="font-bold text-teal-700 text-lg">
            <i className="fa-solid fa-cart-shopping mr-2"></i>Đơn hàng
          </div>
          <button
            onClick={() => { setCart([]); setOtherCosts(0); setIsOtherCostOnly(false); setPaymentMethod(null); }}
            className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200"
          >
            <i className="fa-solid fa-trash mr-1"></i>Xóa trắng
          </button>
        </div>

        {/* Customer info */}
        <div className="p-3 border-b grid grid-cols-2 gap-2 bg-white">
          <input
            type="text"
            value={posCustomer.name}
            onChange={e => setPosCustomer(p => ({ ...p, name: e.target.value }))}
            placeholder="👤 Tên khách hàng"
            className="p-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <input
            type="text"
            value={posCustomer.phone}
            onChange={e => setPosCustomer(p => ({ ...p, phone: e.target.value }))}
            placeholder="📞 Số điện thoại"
            className="p-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 sticky top-0 text-xs uppercase shadow-sm z-10">
              <tr>
                <th className="p-2 text-left w-5/12">Sản phẩm</th>
                <th className="p-2 text-center w-3/12">SL</th>
                <th className="p-2 text-right w-4/12">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-gray-400">
                    <i className="fa-solid fa-box-open text-3xl mb-2"></i><br />Chưa có sản phẩm
                  </td>
                </tr>
              ) : (
                cart.map((item, index) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="font-medium text-gray-800 leading-tight">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatPrice(item.price)}/{item.unit}</div>
                    </td>
                    <td className="p-2 text-center align-middle">
                      <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-lg p-1 border">
                        <button
                          onClick={() => updateQty(index, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-teal-600"
                        >
                          <i className="fa-solid fa-minus text-xs"></i>
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onFocus={e => e.target.select()}
                          onChange={e => setQtyDirectly(index, e.target.value)}
                          onBlur={e => {
                            if (e.target.value === '' || isNaN(parseInt(e.target.value, 10)) || parseInt(e.target.value, 10) <= 0) {
                              setQtyDirectly(index, 1);
                            }
                          }}
                          className="font-bold w-10 text-center font-mono bg-transparent outline-none focus:ring-1 focus:ring-teal-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQty(index, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-teal-600"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-teal-700 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {formatPrice(item.price * (Number(item.qty) || 0))}
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cart footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Số lượng SP:</span>
            <span className="font-bold">{cartTotalQty}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-bold">CHI PHÍ KHÁC:</span>
              <button
                onClick={() => setIsOtherCostOnly(!isOtherCostOnly)}
                className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${isOtherCostOnly ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isOtherCostOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <input
              type="number"
              value={otherCosts || ''}
              onChange={e => setOtherCosts(Number(e.target.value) || 0)}
              disabled={!isOtherCostOnly && cart.length === 0}
              className="w-32 p-1.5 text-right border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between items-end mb-4 border-t-2 border-gray-300 pt-3">
            <span className="text-lg font-bold text-gray-800">TỔNG CỘNG:</span>
            <span className="text-3xl font-bold text-red-600 font-mono">{formatPrice(finalTotal)}</span>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              disabled={paymentMethod === 'transfer'}
              className={[
                'py-3 rounded-lg font-bold border-2 transition touch-manipulation',
                paymentMethod === 'cash'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-inner'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                paymentMethod === 'transfer' ? 'opacity-50 grayscale' : '',
              ].join(' ')}
            >
              <i className="fa-solid fa-money-bill-wave mr-1"></i> TIỀN MẶT
            </button>
            <button
              onClick={() => setPaymentMethod('transfer')}
              disabled={paymentMethod === 'cash'}
              className={[
                'py-3 rounded-lg font-bold border-2 transition touch-manipulation',
                paymentMethod === 'transfer'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-inner'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                paymentMethod === 'cash' ? 'opacity-50 grayscale' : '',
              ].join(' ')}
            >
              <i className="fa-solid fa-qrcode mr-1"></i> CHUYỂN KHOẢN
            </button>
          </div>

          {paymentMethod && (
            <div
              className="text-center mb-3 text-xs text-gray-500 cursor-pointer hover:text-red-500"
              onClick={() => setPaymentMethod(null)}
            >
              <i className="fa-solid fa-rotate-left"></i> Chọn lại phương thức
            </div>
          )}

          <button
            onClick={() => setShowPrintConfirm(true)}
            disabled={!canCheckout}
            className={[
              'w-full p-4 rounded-xl text-lg font-bold uppercase transition touch-manipulation flex items-center justify-center gap-2',
              canCheckout
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            ].join(' ')}
          >
            <i className="fa-solid fa-check-double"></i> Thanh Toán
          </button>
        </div>
      </div>

      {showPrintConfirm && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            {isProcessing ? (
              <div className="p-10 flex flex-col items-center justify-center text-teal-600">
                <i className="fa-solid fa-spinner fa-spin text-5xl mb-4"></i>
                <div className="font-bold text-lg">Đang xử lý giao dịch...</div>
              </div>
            ) : (
              <>
                <div className="p-5 border-b flex justify-between items-center bg-teal-50">
                  <h2 className="text-lg font-bold text-teal-700 flex items-center gap-2">
                    <i className="fa-solid fa-print"></i> In Hóa Đơn
                  </h2>
                  <button onClick={() => setShowPrintConfirm(false)} className="text-gray-400 hover:text-gray-600 transition">
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>
                <div className="p-6 text-center text-gray-700">
                  Bạn có muốn in hóa đơn cho đơn hàng này không?
                </div>
                <div className="p-4 bg-gray-50 flex gap-3 border-t">
                  <button
                    onClick={() => handleCheckoutSubmit(false)}
                    className="flex-1 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                  >
                    Không In
                  </button>
                  <button
                    onClick={() => handleCheckoutSubmit(true)}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition shadow-md flex items-center justify-center gap-2"
                  >
                    In Hóa Đơn
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {printData && (
        <div className="hidden print:block absolute inset-0 bg-white z-[9999] w-full" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <style type="text/css" media="print">
            {`
              @media print {
                @page { size: A5 portrait; margin: 0mm; }
                body * { visibility: hidden; }
                .print\\:block, .print\\:block * { visibility: visible; }
                .print\\:block { position: absolute; left: 0; top: 0; width: 100%; max-width: 148mm; padding: 5mm 10mm; }
              }
            `}
          </style>
          
          <h1 className="text-center font-bold text-2xl mb-1">HÓA ĐƠN BÁN HÀNG</h1>
          <p className="text-center italic text-sm mb-6">
            Ngày {printData.date.day.toString().padStart(2, "0")} Tháng{" "}
            {printData.date.month.toString().padStart(2, "0")} Năm{" "}
            {printData.date.year}
          </p>

          <div className="flex justify-between mb-2 text-[15px]">
            <div className="flex gap-4 w-2/3">
              <span className="whitespace-nowrap">Họ tên:</span>
              <span className="uppercase flex-1">{printData.customerName}</span>
            </div>
            <div className="flex gap-4 w-1/3">
              <span className="whitespace-nowrap">Năm sinh:</span>
              <span className="flex-1"></span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6 text-[15px]">
            <span className="whitespace-nowrap">Địa chỉ:</span>
            <span className="flex-1"></span>
          </div>

          <table className="w-full border-collapse border border-black mb-2 text-[15px]">
            <thead>
              <tr>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">STT</th>
                <th className="border border-black p-2 text-center font-bold">Tên thuốc, VTYT</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">Số lượng</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">Đơn giá</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {printData.cart.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2">{item.name}</td>
                  <td className="border border-black p-2 text-center">{item.qty}</td>
                  <td className="border border-black p-2 text-right">{item.price.toLocaleString()}</td>
                  <td className="border border-black p-2 text-right">{(item.price * (Number(item.qty) || 0)).toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="border border-black p-2 text-center font-bold">
                  Tổng cộng:
                </td>
                <td className="border border-black p-2 text-right">
                  {printData.totalAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex gap-3 mb-10 text-[15px]">
            <span className="italic">Bằng chữ:</span>
            <span className="italic">{docTienBangChu(printData.totalAmount)} .</span>
          </div>

          <div className="flex justify-end pr-16 text-[15px]">
            <div className="text-center">
              <p>Người bán</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
