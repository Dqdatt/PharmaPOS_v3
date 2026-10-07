import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import './LabelMaker.css';

const SENDER_NAME = 'QUỐC ĐƯỜNG';
const SENDER_PHONES = ['0947 204 374', '0888 90 4297'];

const ITEM_TYPES = [
  'thuốc men, y tế',
  'thực phẩm tươi',
  'thực phẩm dễ vỡ',
];

const ITEM_CONDITIONS = [
  'dễ vỡ, xin nhẹ tay',
  'dễ ướt, xin để nơi khô ráo',
];

const OFFICE_PICKUP = 'Người nhận đến văn phòng để nhận hàng';
const CALL_RECIPIENT = 'Gọi người nhận';
const DELIVERY_METHODS = [
  OFFICE_PICKUP,
  CALL_RECIPIENT,
];

const fieldClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100';

const withPeriod = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const capitalizeWords = (value: string) => {
  const normalized = value.trim().toLocaleLowerCase('vi-VN');
  return normalized
    .split(/\s+/)
    .map(word => `${word.charAt(0).toLocaleUpperCase('vi-VN')}${word.slice(1)}`)
    .join(' ');
};

const PreviewValue = ({ value, placeholder, compact = false }: { value: string; placeholder: string; compact?: boolean }) => (
  <span className={`label-dynamic${compact ? ' label-dynamic--compact' : ''}${value.trim() ? '' : ' label-dynamic--empty'}`}>
    {value.trim() || placeholder}
  </span>
);

interface LabelContentProps {
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  destination: string;
  address: string;
  itemType: string;
  itemCondition: string;
  deliveryMethod: string;
  deliveryLocation: string;
  note: string;
}

const LabelContent = ({
  senderPhone,
  recipientName,
  recipientPhone,
  destination,
  address,
  itemType,
  itemCondition,
  deliveryMethod,
  deliveryLocation,
  note,
}: LabelContentProps) => {
  const deliveryInstruction = deliveryMethod === CALL_RECIPIENT
    ? deliveryLocation.trim()
      ? `Đến ${capitalizeWords(deliveryLocation)} - gọi khách để nhận hàng.`
      : 'Gọi người nhận để nhận hàng.'
    : withPeriod(OFFICE_PICKUP);

  return (
    <article className="shipping-label" aria-label="Bản xem trước tem A6">
    <div className="label-sender-row">
      <div className="label-no-wrap"><strong>NGƯỜI GỬI:</strong> {SENDER_NAME}</div>
      <div className="label-no-wrap"><strong>SĐT:</strong> {senderPhone}</div>
    </div>

    <div className="label-recipient-line">
      <strong>NGƯỜI NHẬN:</strong>{' '}
      <PreviewValue value={recipientName} placeholder="TÊN NGƯỜI NHẬN" compact={recipientName.length > 30} />
    </div>
    <div className="label-recipient-phone">
      <strong>SĐT:</strong>{' '}
      <PreviewValue value={recipientPhone} placeholder="SỐ ĐIỆN THOẠI" />
    </div>

    <div className="label-destination-block">
      <div className="label-destination-line">
        <strong>NƠI NHẬN:</strong>{' '}
        <PreviewValue value={destination} placeholder="NƠI NHẬN" compact={destination.length > 32} />
      </div>
      <div className={`label-address${address.length > 88 ? ' label-address--compact' : ''}${address.trim() ? '' : ' label-dynamic--empty'}`}>
        {address.trim() ? `(${withPeriod(address).replace(/\.$/, '')}).` : '(ĐỊA CHỈ NHẬN HÀNG).'}
      </div>
    </div>

    <div className="label-instructions">
      <div>** Hàng {itemType} {withPeriod(itemCondition)}</div>
      <div>** {deliveryInstruction}</div>
      {note.trim() && <div className={note.length > 75 ? 'label-instruction--compact' : ''}>** {withPeriod(note)}</div>}
    </div>

    <div className="label-urgent">***HÀNG ĐI GẤP TRONG NGÀY***</div>
    </article>
  );
};

export default function LabelMaker() {
  const [senderPhone, setSenderPhone] = useState(SENDER_PHONES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [address, setAddress] = useState('');
  const [itemCondition, setItemCondition] = useState(ITEM_CONDITIONS[0]);
  const [itemType, setItemType] = useState(ITEM_TYPES[0]);
  const [deliveryMethod, setDeliveryMethod] = useState(DELIVERY_METHODS[0]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [note, setNote] = useState('');

  const isReadyToPrint = useMemo(
    () => [recipientName, recipientPhone, destination, address].every(value => value.trim().length > 0),
    [recipientName, recipientPhone, destination, address],
  );

  const resetForm = () => {
    setSenderPhone(SENDER_PHONES[0]);
    setRecipientName('');
    setRecipientPhone('');
    setDestination('');
    setAddress('');
    setItemCondition(ITEM_CONDITIONS[0]);
    setItemType(ITEM_TYPES[0]);
    setDeliveryMethod(DELIVERY_METHODS[0]);
    setDeliveryLocation('');
    setNote('');
  };

  const labelContentProps: LabelContentProps = {
    senderPhone,
    recipientName,
    recipientPhone,
    destination,
    address,
    itemType,
    itemCondition,
    deliveryMethod,
    deliveryLocation,
    note,
  };

  return (
    <div className="label-maker-view w-full h-full overflow-y-auto bg-gray-50/70 p-4 lg:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <i className="fa-solid fa-tag text-teal-600"></i>
            Tạo Tem Dán Thùng Hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500">Nhập thông tin, kiểm tra bản xem trước A6 rồi in trực tiếp. Dữ liệu không được lưu vào hệ thống.</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(420px,0.85fr)_minmax(600px,1.15fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-bold text-gray-800">Thông tin trên tem</h2>
                <p className="mt-0.5 text-xs text-gray-400">Các mục có dấu * cần được nhập trước khi in</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Không lưu DB</span>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">Người gửi</span>
                  <div className="flex min-h-[42px] items-center rounded-xl border border-gray-200 bg-gray-100 px-3.5 text-sm font-bold text-gray-700">
                    {SENDER_NAME}
                    <i className="fa-solid fa-lock ml-auto text-xs text-gray-400"></i>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">SĐT người gửi</span>
                  <select value={senderPhone} onChange={event => setSenderPhone(event.target.value)} className={fieldClass}>
                    {SENDER_PHONES.map(phone => <option key={phone} value={phone}>{phone}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">Người nhận *</span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={event => setRecipientName(event.target.value)}
                    className={fieldClass}
                    placeholder="Ví dụ: Trần Văn Nam"
                    maxLength={45}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">SĐT người nhận *</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={recipientPhone}
                    onChange={event => setRecipientPhone(event.target.value)}
                    className={fieldClass}
                    placeholder="Ví dụ: 0935 774 900"
                    maxLength={20}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-gray-700">Nơi nhận *</span>
                <input
                  type="text"
                  value={destination}
                  onChange={event => setDestination(event.target.value)}
                  className={fieldClass}
                  placeholder="Ví dụ: Văn phòng Nha Trang"
                  maxLength={55}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-gray-700">Địa chỉ *</span>
                <textarea
                  value={address}
                  onChange={event => setAddress(event.target.value)}
                  className={`${fieldClass} min-h-20 resize-y`}
                  placeholder="Ví dụ: 176 Trần Quý Cáp, TP. Nha Trang, tỉnh Khánh Hòa"
                  maxLength={130}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">Loại hàng</span>
                  <select value={itemType} onChange={event => setItemType(event.target.value)} className={fieldClass}>
                    {ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">Tình trạng hàng</span>
                  <select value={itemCondition} onChange={event => setItemCondition(event.target.value)} className={fieldClass}>
                    {ITEM_CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-gray-700">Phương thức nhận</span>
                <select value={deliveryMethod} onChange={event => setDeliveryMethod(event.target.value)} className={fieldClass}>
                  {DELIVERY_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>

              {deliveryMethod === CALL_RECIPIENT && (
                <label className="block rounded-xl border border-teal-100 bg-teal-50/60 p-3.5">
                  <span className="mb-1.5 block text-sm font-bold text-gray-700">Địa điểm đến <span className="font-normal text-gray-400">(không bắt buộc)</span></span>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={event => setDeliveryLocation(event.target.value)}
                    className={fieldClass}
                    placeholder="Ví dụ: Bến xe phía Nam"
                    maxLength={55}
                  />
                  <span className="mt-1.5 block text-xs text-gray-500">Để trống sẽ in “Gọi người nhận để nhận hàng”.</span>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-gray-700">Ghi chú</span>
                <input
                  type="text"
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  className={fieldClass}
                  placeholder="Không bắt buộc; nếu có sẽ hiện ở dòng ** thứ 3"
                  maxLength={100}
                />
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm xl:sticky xl:top-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-gray-800">Xem trước tem</h2>
                <p className="mt-0.5 text-xs text-gray-400">A6 ngang · 148 × 105 mm</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  <i className="fa-solid fa-rotate-left mr-2"></i>Xóa nội dung
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!isReadyToPrint}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                  title={isReadyToPrint ? 'In tem khổ A6 ngang' : 'Vui lòng nhập đủ các mục có dấu *'}
                >
                  <i className="fa-solid fa-print mr-2"></i>In tem A6
                </button>
              </div>
            </div>

            <div className="label-preview-stage overflow-auto p-4 sm:p-6">
              <LabelContent {...labelContentProps} />
            </div>

          </section>
        </div>
      </div>
      {createPortal(
        <div className="label-print-portal" aria-hidden="true">
          <LabelContent {...labelContentProps} />
        </div>,
        document.body,
      )}
    </div>
  );
}
