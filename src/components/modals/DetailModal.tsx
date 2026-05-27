import { useState, useEffect } from 'react';
import { usePos, Purchase, Invoice } from '../../contexts/PosContext';
import mqtt from 'mqtt';
import { bankInfo, formatQRText } from '../../utils/bank';
import { docTienBangChu } from '../../utils/numberToWords';
interface Props {
  type: 'PO' | 'INV';
  data: Purchase | Invoice;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DetailModal({ type, data, onClose, onEdit }: Props) {
  const { formatPrice } = usePos();

  const isPO = type === 'PO';
  const po = isPO ? (data as Purchase) : null;
  const inv = !isPO ? (data as Invoice) : null;

  const [isReQRModalOpen, setIsReQRModalOpen] = useState(false);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);

  const DEVICE_ID = "device001";
  const mqtt_topic = `qr/${DEVICE_ID}`;

  useEffect(() => {
    if (!isPO) {
      const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");
      client.on("connect", () => setMqttClient(client));
      return () => { client.end(true); };
    }
  }, [isPO]);

  const handleQRCode = async () => {
    if (!inv) return;
    setIsReQRModalOpen(true);
    
    if (!mqttClient || !mqttClient.connected) return;
    const safeName = inv.customer.name.trim() || "KHACH LE";
    const addInfoStr = `${formatQRText(safeName)} ${formatQRText(bankInfo.description)}`.replace(/\s+/g, " ").trim();
    
    try {
      const response = await fetch("https://api.vietqr.io/v2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: bankInfo.accountNo,
          accountName: bankInfo.accountName,
          acqId: bankInfo.bankId,
          amount: inv.total.toString(),
          addInfo: addInfoStr,
          format: "text",
          template: "compact2",
        }),
      });
      const resData = await response.json();
      let qrString = "";
      if (resData && resData.code === "00") {
        qrString = resData.data.qrCode;
      }
      const payload = {
        type: "pay",
        amount: inv.total.toString(),
        addInfo: addInfoStr,
        accountNo: bankInfo.accountNo,
        accountName: bankInfo.accountName,
        acqId: bankInfo.bankId,
        qrText: qrString,
      };
      mqttClient.publish(mqtt_topic, JSON.stringify(payload), { qos: 1 });
    } catch (error) {
      console.error(error);
    }
  };

  const cancelQR = () => {
    setIsReQRModalOpen(false);
    if (mqttClient && mqttClient.connected) {
      mqttClient.publish(mqtt_topic, JSON.stringify({ type: "cancel" }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const items = isPO
    ? (data as Purchase).items.map(i => ({ name: i.name, unit: i.unit, qty: i.qty, price: i.cost }))
    : (data as Invoice).items.map(i => ({ name: i.name, unit: i.unit, qty: i.qty, price: i.price }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-gray-800">
              {isPO ? 'Chi tiết Phiếu Nhập' : 'Chi tiết Hóa Đơn'} {data.id}
            </h3>
            {isPO && onEdit && (
              <button 
                onClick={onEdit} 
                className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-lg text-sm font-bold transition flex items-center gap-1 border border-yellow-300"
              >
                <i className="fa-solid fa-pen"></i> Sửa
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 text-sm">
          {isPO && po ? (
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border">
              <div><span className="text-gray-500 text-xs font-bold block">NHÀ CUNG CẤP</span>{po.supplier || '—'}</div>
              <div><span className="text-gray-500 text-xs font-bold block">NGÀY TẠO</span>{po.date}</div>
              <div className="col-span-2"><span className="text-gray-500 text-xs font-bold block">GHI CHÚ</span>{po.note || '—'}</div>
            </div>
          ) : inv ? (
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border">
              <div>
                <span className="text-gray-500 text-xs font-bold block">KHÁCH HÀNG</span>
                {inv.customer.name}{inv.customer.phone ? ` - ${inv.customer.phone}` : ''}
              </div>
              <div><span className="text-gray-500 text-xs font-bold block">THỜI GIAN</span>{inv.time}</div>
              <div><span className="text-gray-500 text-xs font-bold block">NHÂN VIÊN</span>{inv.employeeName}</div>
              <div>
                <span className="text-gray-500 text-xs font-bold block">THANH TOÁN</span>
                {inv.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
              </div>
            </div>
          ) : null}

          <table className="w-full text-left border">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="p-2 border-b">Sản phẩm</th>
                <th className="p-2 border-b text-center">SL</th>
                <th className="p-2 border-b text-right">Đơn giá</th>
                <th className="p-2 border-b text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{item.name}<br /><span className="text-xs text-gray-500">{item.unit}</span></td>
                  <td className="p-2 text-center font-bold">{item.qty}</td>
                  <td className="p-2 text-right font-mono">{formatPrice(item.price)}</td>
                  <td className="p-2 text-right font-mono font-bold">{formatPrice(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isPO && inv && inv.otherCosts > 0 && (
            <div className="flex justify-between items-center mt-2 text-gray-600">
              <span>Chi phí khác:</span>
              <span className="font-mono">{formatPrice(inv.otherCosts)}</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t-2">
            <span className="font-bold text-lg">TỔNG CỘNG:</span>
            <span className="font-bold text-2xl text-red-600 font-mono">{formatPrice(data.total)}</span>
          </div>

          {!isPO && inv && (
            <div className="flex gap-3 mt-6 no-print">
              {inv.method === 'transfer' && (
                <button
                  onClick={handleQRCode}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-qrcode"></i> QR Code
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-green-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-print"></i> In lại HĐ
              </button>
            </div>
          )}
        </div>
      </div>

      {isReQRModalOpen && inv && (
        <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6" onClick={cancelQR}>
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-black text-gray-800 uppercase mb-6 tracking-widest">Quét mã thanh toán</h2>
            <div className="w-full aspect-square bg-gray-50 rounded-3xl mb-6 flex items-center justify-center border border-gray-100 overflow-hidden">
              <img
                src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${inv.total}&addInfo=${encodeURIComponent(formatQRText(inv.customer.name || "KHACH HANG") + " " + formatQRText(bankInfo.description))}&accountName=${encodeURIComponent(formatQRText(bankInfo.accountName))}`}
                className="w-full h-full object-contain p-4"
                alt="QR"
              />
            </div>
            <button onClick={cancelQR} className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-bold uppercase hover:bg-gray-200 transition">Đóng</button>
          </div>
        </div>
      )}

      {/* PRINT AREA */}
      {!isPO && inv && (
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
            Ngày {inv.time.split(/[\s,]+/)[0]}
          </p>

          <div className="flex justify-between mb-2 text-[15px]">
            <div className="flex gap-4 w-2/3">
              <span className="whitespace-nowrap">Họ tên:</span>
              <span className="uppercase flex-1">{inv.customer.name}</span>
            </div>
          </div>
          
          <table className="w-full border-collapse border border-black mb-2 text-[15px]">
            <thead>
              <tr>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">STT</th>
                <th className="border border-black p-2 text-center font-bold">Tên thuốc, VTYT</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">SL</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">Đơn giá</th>
                <th className="border border-black p-2 text-center w-1 whitespace-nowrap font-bold">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2">{item.name}</td>
                  <td className="border border-black p-2 text-center">{item.qty}</td>
                  <td className="border border-black p-2 text-right">{item.price.toLocaleString()}</td>
                  <td className="border border-black p-2 text-right">{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="border border-black p-2 text-center font-bold">
                  Tổng cộng:
                </td>
                <td className="border border-black p-2 text-right">
                  {inv.total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex gap-3 mb-10 text-[15px]">
            <span className="italic">Bằng chữ:</span>
            <span className="italic">{docTienBangChu(inv.total)} .</span>
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
