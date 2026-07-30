import { useState, useEffect } from 'react';
import { usePos, Purchase, Invoice } from '../../contexts/PosContext';
import mqtt from 'mqtt';
import { bankInfo, formatQRText } from '../../utils/bank';
import { docTienBangChu } from '../../utils/numberToWords';
import { showNotification } from '../../utils/toast';
import { createDbTimestamp, getDbErrorMessage } from '../../utils/dbFallback';
interface Props {
  type: 'PO' | 'INV';
  data: Purchase | Invoice;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DetailModal({ type, data, onClose, onEdit }: Props) {
  const { formatPrice, updatePurchasePaymentInDB, deletePurchaseFromDB, suppliers, getNow } = usePos();

  const isPO = type === 'PO';
  const po = isPO ? (data as Purchase) : null;
  const inv = !isPO ? (data as Invoice) : null;

  const [isReQRModalOpen, setIsReQRModalOpen] = useState(false);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  const [poQrOpen, setPoQrOpen] = useState(false);

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

  const handleDebt = async () => {
    if (!po) return;
    try {
      const updatedPo = { ...po, status: 'DEBT' as const, debtAt: createDbTimestamp() };
      await updatePurchasePaymentInDB(updatedPo);
      showNotification("Đã chuyển sang công nợ thành công!", "success");
      onClose();
    } catch (e) {
      showNotification(`Lỗi khi cập nhật công nợ: ${getDbErrorMessage(e)}`, "error");
      console.error(e);
    }
  };

  const handleConfirmPayment = async () => {
    if (!po) return;
    try {
      const paidAt = createDbTimestamp();
      const updatedPo = { ...po, status: 'COMPLETED' as const, paymentMethod: 'transfer', paidAt, lockedAt: paidAt };
      await updatePurchasePaymentInDB(updatedPo); 
      showNotification("Đã xác nhận thanh toán thành công!", "success");
      setPoQrOpen(false);
      onClose();
    } catch (e) {
      showNotification(`Lỗi khi cập nhật thanh toán: ${getDbErrorMessage(e)}`, "error");
      console.error(e);
    }
  };

  const handleConfirmCashPayment = async () => {
    if (!po) return;
    if (confirm('Xác nhận thanh toán công nợ bằng tiền mặt?')) {
      try {
        const paidAt = createDbTimestamp();
        const updatedPo = { ...po, status: 'COMPLETED' as const, paymentMethod: 'cash', paidAt, lockedAt: paidAt };
        await updatePurchasePaymentInDB(updatedPo); 
        showNotification("Đã xác nhận thanh toán thành công!", "success");
        onClose();
      } catch (e) {
        showNotification(`Lỗi khi cập nhật thanh toán: ${getDbErrorMessage(e)}`, "error");
        console.error(e);
      }
    }
  };

  const handleDelete = async () => {
    if (!po) return;
    if (confirm('Bạn có chắc chắn muốn xóa phiếu nhập này? Hành động này không thể hoàn tác!')) {
      try {
        await deletePurchaseFromDB(po.id);
        showNotification("Đã xóa phiếu nhập thành công!", "success");
        onClose();
      } catch (e) {
        alert("Lỗi khi xóa phiếu nhập");
      }
    }
  };

  const supplierObj = po?.supplierId ? suppliers.find(s => s.id === po.supplierId) : null;

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
            {isPO && onEdit && po?.status !== 'COMPLETED' && (
              <div className="flex gap-2">
                <button 
                  onClick={onEdit} 
                  className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-lg text-sm font-bold transition flex items-center gap-1 border border-yellow-300"
                >
                  <i className="fa-solid fa-pen"></i> Sửa
                </button>
                <button 
                  onClick={handleDelete} 
                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-bold transition flex items-center gap-1 border border-red-300"
                >
                  <i className="fa-solid fa-trash"></i> Xóa
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-5 text-sm">
          {isPO && po && (
            <div className="flex items-center justify-between mb-6 border-b pb-4 relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
              
              <div className="flex flex-col items-center gap-1 bg-white px-2">
                <div className="w-5 h-5 rounded-full bg-red-500 border-[3px] border-white shadow-sm flex items-center justify-center">
                  {po.status !== 'CREATED' && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                </div>
                <div className="text-[11px] font-bold text-gray-800 mt-1">Khởi tạo</div>
                <div className="text-[10px] text-gray-500">{po.date.split(' ')[1] || po.date}</div>
              </div>
              
              {(po.status === 'DEBT' || po.debtAt) && (
                <div className="flex flex-col items-center gap-1 bg-white px-2">
                  <div className={`w-5 h-5 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center ${po.status === 'COMPLETED' ? 'bg-yellow-500' : 'bg-yellow-500'}`}>
                    {po.status === 'COMPLETED' && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                  </div>
                  <div className="text-[11px] font-bold text-gray-800 mt-1">Công nợ</div>
                  <div className="text-[10px] text-gray-500">{po.debtAt ? (po.debtAt.includes('T') ? new Date(po.debtAt).toLocaleDateString('vi-VN') : po.debtAt.split(' ')[1]) : ''}</div>
                </div>
              )}

              <div className="flex flex-col items-center gap-1 bg-white px-2">
                <div className={`w-5 h-5 rounded-full border-[3px] border-white shadow-sm flex items-center justify-center ${po.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {po.status === 'COMPLETED' && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                </div>
                <div className="text-[11px] font-bold text-gray-800 mt-1">Hoàn tất</div>
                <div className="text-[10px] text-gray-500">{po.paidAt ? (po.paidAt.includes('T') ? new Date(po.paidAt).toLocaleDateString('vi-VN') : po.paidAt.split(' ')[1]) : ''}</div>
              </div>
            </div>
          )}

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
              <div><span className="text-gray-500 text-xs font-bold block">ĐỊA CHỈ</span>{inv.customer.address || '—'}</div>
              <div><span className="text-gray-500 text-xs font-bold block">BÁC SĨ CHỈ ĐỊNH</span>{inv.customer.doctorName || '—'}</div>
              <div><span className="text-gray-500 text-xs font-bold block">GHI CHÚ</span>{inv.customer.note || '—'}</div>
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

          {isPO && po && (
            <div className="mt-6 flex flex-col gap-3">
               {po.status === 'CREATED' && (
                 <div className="flex gap-3">
                   <button onClick={() => setPoQrOpen(true)} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg font-bold transition shadow-sm">Thanh toán ngay</button>
                   <button onClick={handleDebt} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg font-bold transition shadow-sm">Chuyển công nợ</button>
                 </div>
               )}
               {po.status === 'DEBT' && (
                 <div className="flex gap-3">
                   <button onClick={() => setPoQrOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition shadow-sm">Chuyển khoản</button>
                   <button onClick={handleConfirmCashPayment} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg font-bold transition shadow-sm">Tiền mặt</button>
                 </div>
               )}
               {po.status === 'COMPLETED' && (
                 <div className="text-center text-teal-700 font-bold text-sm bg-teal-50 border border-teal-100 p-3 rounded-lg flex items-center justify-center gap-2">
                   <i className="fa-solid fa-lock"></i> Đã khóa chỉnh sửa
                 </div>
               )}
            </div>
          )}

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

      {poQrOpen && po && (
        <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setPoQrOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-800 mb-4">Thanh toán Phiếu Nhập</h2>
            {supplierObj?.bankName && supplierObj?.accountNumber ? (
              <>
                <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-4 flex items-center justify-center border border-gray-100 overflow-hidden">
                  <img
                    src={`https://img.vietqr.io/image/${supplierObj.bankName}-${supplierObj.accountNumber}-qr_only.png?amount=${po.total}&addInfo=${encodeURIComponent("THANH TOAN " + po.id)}&accountName=${encodeURIComponent(formatQRText(supplierObj.accountName || supplierObj.name))}`}
                    className="w-full h-full object-contain p-4"
                    alt="QR"
                  />
                </div>
                <div className="text-sm font-bold text-gray-700 text-center mb-6 flex flex-col gap-1">
                  <span className="text-base uppercase text-gray-900">{supplierObj.accountName || supplierObj.name}</span>
                  <span className="text-gray-600 tracking-wide">{supplierObj.bankName} - {supplierObj.accountNumber}</span>
                  <span className="text-red-600 text-lg mt-1">{formatPrice(po.total)}</span>
                </div>
                <button onClick={handleConfirmPayment} className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition shadow-md mb-2">
                  Xác nhận đã thanh toán
                </button>
              </>
            ) : (
              <div className="text-center text-red-500 mb-6 bg-red-50 p-4 rounded-lg">
                <i className="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                <p className="text-sm">Nhà cung cấp này chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản trong Quản lý NCC.</p>
              </div>
            )}
            <button onClick={() => setPoQrOpen(false)} className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition">Đóng</button>
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
            {(() => {
              const dateMatch = inv.time.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
              if (dateMatch) {
                const [d, m, y] = dateMatch[0].split('/');
                return `Ngày ${d.padStart(2, '0')} Tháng ${m.padStart(2, '0')} Năm ${y}`;
              }
              return `Ngày ${inv.time}`;
            })()}
          </p>

          <div className="flex flex-col gap-1 mb-2 text-[15px]">
            <div className="flex gap-4">
              <span className="whitespace-nowrap">Họ tên:</span>
              <span className="uppercase flex-1 font-bold">{inv.customer.name}</span>
            </div>
            {inv.customer.phone && (
              <div className="flex gap-4">
                <span className="whitespace-nowrap">SĐT:</span>
                <span className="flex-1">{inv.customer.phone}</span>
              </div>
            )}
            {inv.customer.address && (
              <div className="flex gap-4">
                <span className="whitespace-nowrap">Địa chỉ:</span>
                <span className="flex-1">{inv.customer.address}</span>
              </div>
            )}
            {inv.customer.doctorName && (
              <div className="flex gap-4">
                <span className="whitespace-nowrap">Bác sĩ:</span>
                <span className="flex-1 font-bold">{inv.customer.doctorName}</span>
              </div>
            )}
            {inv.customer.note && (
              <div className="flex gap-4">
                <span className="whitespace-nowrap">Ghi chú:</span>
                <span className="flex-1 italic">{inv.customer.note}</span>
              </div>
            )}
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

          <div className="flex gap-3 mb-6 text-[15px]">
            <span className="italic">Bằng chữ:</span>
            <span className="italic">{docTienBangChu(inv.total)} .</span>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-400 text-sm">
            <p className="font-bold mb-1">Hotline đặt thuốc, vật tư y tế và CSKH: 0888 90 4297</p>
            <p className="italic">Rất hân hạnh được phục vụ, xin cảm ơn và hẹn gặp lại.</p>
          </div>
        </div>
      )}
    </div>
  );
}
