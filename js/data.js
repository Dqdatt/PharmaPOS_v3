/* Dữ liệu mẫu dùng chung cho mọi màn. Claude giữ file này; màn cần thêm dữ liệu thì khai báo trong file màn. */
(function () {
  const hourly = [640, 1320, 1880, 2240, 2060, 1150, 2070, 1120, 0, 0, 0, 0, 0, 0, 0, 0].map((k) => k * 1000); // 7h → 22h
  window.DATA = {
    store: { name: 'Nhà thuốc Tâm An', branch: 'Chi nhánh Lê Văn Sỹ', address: '214 Lê Văn Sỹ, Phường 1, Quận 3, TP.HCM' },
    owner: { name: 'Trần Minh Khoa', role: 'Chủ nhà thuốc', phone: '0903 128 466', initials: 'MK' },
    today: {
      dateLabel: 'Thứ Tư, 25 tháng 11', hourStart: 7, nowHour: 14, hourly,
      revenue: hourly.reduce((a, b) => a + b, 0), // 12.480.000
      yesterday: 11534000, invoices: 86, customers: 71, lastSale: '14:32',
      payments: [{ key: 'Chuyển khoản', value: 6480000 }, { key: 'Tiền mặt', value: 5120000 }, { key: 'Thẻ', value: 880000 }],
      byStaff: [{ name: 'Ngọc Hân', value: 6240000, invoices: 41 }, { name: 'Minh Tuấn', value: 4110000, invoices: 29 }, { name: 'Thu Trang', value: 2130000, invoices: 16 }],
    },
    week: [
      { label: 'T5', date: '19/11', value: 10920000 }, { label: 'T6', date: '20/11', value: 13400000 }, { label: 'T7', date: '21/11', value: 15860000 },
      { label: 'CN', date: '22/11', value: 14200000 }, { label: 'T2', date: '23/11', value: 9870000 }, { label: 'T3', date: '24/11', value: 11534000 },
      { label: 'T4', date: '25/11', value: 12480000 },
    ],
    month: { label: 'Tháng 11', revenue: 318650000, lastMonthSameDay: 296400000, invoices: 2214, target: 400000000 },
    invoices: [
      { id: 'HD2511-086', time: '14:32', items: ['Panadol Extra', 'Berberin', 'Oresol', 'Vitamin C 500'], total: 186000, staff: 'Thu Trang', pay: 'Chuyển khoản' },
      { id: 'HD2511-085', time: '14:20', items: ['Augmentin 625mg'], total: 245000, staff: 'Thu Trang', pay: 'Tiền mặt' },
      { id: 'HD2511-084', time: '14:05', items: ['Telfast HD 180', 'Strepsils'], total: 132000, staff: 'Thu Trang', pay: 'Chuyển khoản' },
      { id: 'HD2511-083', time: '13:51', items: ['Smecta', 'Oresol', 'Men vi sinh Enterogermina'], total: 158000, staff: 'Thu Trang', pay: 'Tiền mặt' },
      { id: 'HD2511-082', time: '13:40', items: ['Gaviscon'], total: 96000, staff: 'Minh Tuấn', pay: 'Thẻ' },
    ],
    lowStock: [
      { name: 'Hapacol 650', unit: 'vỉ', left: 4, min: 20 },
      { name: 'Panadol Extra', unit: 'hộp', left: 3, min: 10 },
      { name: 'Oresol 245', unit: 'gói', left: 12, min: 50 },
      { name: 'Efferalgan 500mg', unit: 'hộp', left: 2, min: 8 },
      { name: 'Berberin 100mg', unit: 'lọ', left: 5, min: 15 },
    ],
    expiring: [
      { name: 'Augmentin 625mg', lot: 'L2304', exp: '12/12/2026', days: 17, qty: '6 hộp' },
      { name: 'Smecta', lot: 'SM118', exp: '20/12/2026', days: 25, qty: '14 gói' },
      { name: 'Decolgen Forte', lot: 'DC072', exp: '24/12/2026', days: 29, qty: '9 vỉ' },
    ],
    payables: [{ supplier: 'Công ty Dược Phúc Long', amount: 4200000, due: '28/11' }],
    shifts: [
      { name: 'Ngọc Hân', shift: 'Ca sáng 7:00 đến 14:00', status: 'Hết ca 14:02' },
      { name: 'Minh Tuấn', shift: 'Ca sáng 7:00 đến 14:00', status: 'Hết ca 14:00' },
      { name: 'Thu Trang', shift: 'Ca chiều 14:00 đến 22:00', status: 'Đang làm' },
    ],
    webSessions: [
      { id: 'w1', browser: 'Chrome', os: 'macOS', device: 'MacBook Pro', place: 'Quận 3, TP.HCM', ip: '113.161.24.8', since: '08:12 hôm nay', lastActive: '2 phút trước' },
    ],
    // Yêu cầu đăng nhập web đang chờ duyệt (web hiện số 47, điện thoại phải chọn đúng số này)
    webRequest: { id: 'r1', browser: 'Safari', os: 'macOS', device: 'iMac quầy thuốc', place: 'Quận 3, TP.HCM', ip: '113.161.24.10', time: '14:36', code: 47, choices: [82, 47, 15], expiresIn: 120 },
    notifications: [
      { id: 'n1', kind: 'web', title: 'Có yêu cầu đăng nhập web', body: 'Safari trên iMac quầy thuốc, Quận 3', time: '14:36', unread: true },
      { id: 'n2', kind: 'stock', title: 'Panadol Extra sắp hết', body: 'Còn 3 hộp, mức tối thiểu 10 hộp', time: '13:10', unread: true },
      { id: 'n3', kind: 'revenue', title: 'Doanh thu hôm qua 11.534.000 ₫', body: 'Thấp hơn thứ Ba tuần trước 4%', time: '08:00', unread: false },
      { id: 'n4', kind: 'expiry', title: '3 lô thuốc hết hạn trong 30 ngày', body: 'Augmentin 625mg hết hạn sớm nhất, 12/12', time: 'Hôm qua', unread: false },
    ],
  };
})();
