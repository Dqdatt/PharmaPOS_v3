import { useState } from 'react';
import { usePos, Invoice } from '../contexts/PosContext';
import DetailModal from '../components/modals/DetailModal';
import ExportCKModal from '../components/modals/ExportCKModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { showNotification } from '../utils/toast';

export default function Reports() {
  const { invoices, exportOrders, products, getStock, formatPrice, deleteInvoice } = usePos();
  const [reportTab, setReportTab] = useState<'overview' | 'orders'>('overview');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showExportCKModal, setShowExportCKModal] = useState(false);
  const [orderStatusTab, setOrderStatusTab] = useState<'valid' | 'deleted'>('valid');
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [activeDateStr, setActiveDateStr] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const validInvoices = invoices.filter(inv => inv.status !== 'deleted');
  const paidExportOrders = exportOrders.filter(o => o.status === 'paid');

  const totalInvoiceRevenue = validInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExportRevenue = paidExportOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = totalInvoiceRevenue + totalExportRevenue;
  const totalProfit = validInvoices.reduce((sum, inv) => {
    const costOfGoods = inv.items.reduce((s, i) => {
      const p = products.find(x => x.id === i.id);
      return s + (p ? p.importPrice : 0) * i.qty;
    }, 0);
    return sum + (inv.total - costOfGoods);
  }, 0);
  const inventoryValue = products.reduce((sum, p) => sum + getStock(p) * p.importPrice, 0);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const parseInvDateToISO = (timeStr: string) => {
    const parts = timeStr.split(/[\s,]+/); 
    const dateStr = parts.find(p => p.includes('/'));
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const calendarData = (() => {
    const data: Record<string, number> = {};
    validInvoices.forEach(inv => {
      const dateIso = parseInvDateToISO(inv.time);
      if (!dateIso) return;
      if (!data[dateIso]) data[dateIso] = 0;
      data[dateIso] += (inv.total - inv.otherCosts);
    });
    paidExportOrders.forEach(o => {
      const dateIso = parseInvDateToISO(o.date);
      if (!dateIso) return;
      if (!data[dateIso]) data[dateIso] = 0;
      data[dateIso] += o.total;
    });
    return data;
  })();

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear); 
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0 ... Sun = 6
  
  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const filteredInvoices = invoices.filter(i => {
    const matchSearch = i.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                        i.customer.name.toLowerCase().includes(orderSearchQuery.toLowerCase());
    const matchStatus = orderStatusTab === 'valid' ? i.status !== 'deleted' : i.status === 'deleted';
    const matchDate = orderDateFilter ? parseInvDateToISO(i.time) === orderDateFilter : true;
    return matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  // Safely adjust current page if filtered items shrink
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedInvoices = filteredInvoices.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const exportDoctorCSV = () => {
    const docInvoices = validInvoices.filter(inv => {
      if (!inv.customer.doctorName) return false;
      const dateIso = parseInvDateToISO(inv.time);
      if (!dateIso) return false;
      const [year, month] = dateIso.split('-').map(Number);
      return year === calendarYear && month === calendarMonth + 1;
    });
    if (docInvoices.length === 0) {
      showNotification('Không có đơn hàng nào có bác sĩ chỉ định trong tháng/năm này!', 'error');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Mã HĐ,Thời gian,Khách hàng,SĐT,Địa chỉ,Ghi chú,Bác sĩ,Tên thuốc,SL,Đơn giá,Thành tiền\n";
    
    docInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const row = [
          inv.id,
          inv.time,
          `"${inv.customer.name}"`,
          `"${inv.customer.phone || ''}"`,
          `"${inv.customer.address || ''}"`,
          `"${inv.customer.note || ''}"`,
          `"${inv.customer.doctorName}"`,
          `"${item.name}"`,
          item.qty,
          item.price,
          item.price * item.qty
        ].join(',');
        csvContent += row + "\n";
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DS_Bac_Si_Thang_${calendarMonth + 1}_${calendarYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const invoicesToday = validInvoices.filter(inv => parseInvDateToISO(inv.time) === todayISO);
  const exportsToday = paidExportOrders.filter(o => parseInvDateToISO(o.date) === todayISO);
  
  const otherCostsToday = invoicesToday.reduce((sum, inv) => sum + inv.otherCosts, 0);
  const totalRevenueToday = invoicesToday.reduce((sum, inv) => sum + inv.total, 0) + exportsToday.reduce((sum, o) => sum + o.total, 0);
  const netRevenueToday = totalRevenueToday - otherCostsToday;

  // Filter for the new "Chi phí khác" list
  const [otherCostsDateFilter, setOtherCostsDateFilter] = useState(() => todayISO);

  const otherCostsList = validInvoices.filter(inv => 
    inv.otherCosts > 0 && parseInvDateToISO(inv.time) === otherCostsDateFilter
  );

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete);
      showNotification('Đã xóa hóa đơn và hoàn trả sản phẩm vào kho', 'success');
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      showNotification(`Có lỗi khi xóa hóa đơn! Chi tiết: ${errMsg}`, 'error');
      console.error(e);
    }
    setInvoiceToDelete(null);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Tab switch */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg w-fit shadow-sm border">
        <button
          onClick={() => setReportTab('overview')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${reportTab === 'overview' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setReportTab('orders')}
          className={`px-4 py-2 rounded-md font-bold text-sm transition ${reportTab === 'orders' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Danh sách đơn hàng
        </button>
      </div>

      {/* Overview tab */}
      {reportTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-teal-500 flex flex-col justify-center">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Tổng doanh thu</h3>
              <div className="text-xl font-bold text-teal-700 font-mono truncate">{formatPrice(totalRevenue)}</div>
              <div className="text-[11px] text-gray-400 mt-1 truncate">
                Bán lẻ: {formatPrice(totalInvoiceRevenue)}<br/>
                Xuất kho: {formatPrice(totalExportRevenue)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex flex-col justify-center">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Doanh thu ngày</h3>
              <div className="text-xl font-bold text-green-700 font-mono truncate">{formatPrice(netRevenueToday)}</div>
              <div className="text-[11px] text-gray-400 mt-1 truncate">Trừ chi phí khác</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500 flex flex-col justify-center">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Chi phí khác (Hôm nay)</h3>
              <div className="text-xl font-bold text-purple-700 font-mono truncate">{formatPrice(otherCostsToday)}</div>
              <div className="text-[11px] text-gray-400 mt-1 truncate">Tổng phụ phí hôm nay</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col justify-center">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase truncate">Tổng đơn (Lẻ+Xuất)</h3>
              <div className="text-xl font-bold text-blue-700 font-mono truncate">{validInvoices.length + paidExportOrders.length}</div>
              <div className="text-[11px] text-gray-400 mt-1 truncate">Đơn hàng hợp lệ</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex flex-col justify-center">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Giá trị tồn kho</h3>
              <div className="text-xl font-bold text-amber-700 font-mono truncate">{formatPrice(inventoryValue)}</div>
              <div className="text-[11px] text-gray-400 mt-1 truncate">Tính theo giá nhập</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">Lịch doanh thu</h3>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="text-gray-500 hover:text-teal-600 transition"><i className="fa-solid fa-chevron-left"></i></button>
                  <span className="text-sm font-bold w-20 text-center">T{calendarMonth + 1}/{calendarYear}</span>
                  <button onClick={nextMonth} className="text-gray-500 hover:text-teal-600 transition"><i className="fa-solid fa-chevron-right"></i></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400">
                <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
              </div>
              <div className="grid grid-cols-7 gap-1 flex-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="bg-transparent rounded"></div>;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const revenue = calendarData[dateStr] || 0;
                  const hasData = revenue > 0;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        if (hasData) {
                          setActiveDateStr(activeDateStr === dateStr ? null : dateStr);
                        }
                      }}
                      className={`relative rounded-md p-1 border flex flex-col justify-between transition-all duration-200
                        ${hasData ? 'bg-teal-50 border-teal-100 hover:border-teal-300 cursor-pointer shadow-sm' : 'bg-gray-50 border-transparent opacity-50'}`}
                      title={hasData ? `${dateStr}: ${formatPrice(revenue)}` : dateStr}
                    >
                      <div className={`text-xs font-bold mb-1 ${hasData ? 'text-teal-800' : 'text-gray-400'}`}>
                        {day}
                      </div>
                      {hasData && (
                        <div className="text-[10px] sm:text-xs font-mono font-bold text-teal-600 leading-tight text-right mt-auto truncate" title={formatPrice(revenue)}>
                          {revenue >= 1000000 
                            ? `${(revenue/1000000).toFixed(1)}M` 
                            : revenue >= 1000 
                              ? `${Math.floor(revenue/1000)}k` 
                              : revenue}
                        </div>
                      )}

                      {/* Custom Tooltip Popup */}
                      {activeDateStr === dateStr && hasData && (
                        <div className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-white text-gray-800 rounded-xl py-3 px-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] whitespace-nowrap animate-[scaleIn_0.2s_ease-out] min-w-[160px] text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="text-gray-400 text-[11px] uppercase tracking-wider font-bold mb-1">
                            Doanh thu <span className="text-teal-600">{dateStr.split('-').reverse().join('/')}</span>
                          </div>
                          <div className="text-xl font-bold font-mono text-gray-800">
                            {revenue.toLocaleString('vi-VN')}
                          </div>
                          {/* Triangle / Speech bubble tail */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Đơn hàng gần đây</h3>
              {invoices.length === 0 ? (
                <div className="text-gray-400 text-sm">Chưa có dữ liệu</div>
              ) : (
                invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-bold text-sm text-gray-700">{inv.id}</div>
                      <div className="text-xs text-gray-500">{inv.customer.name}</div>
                    </div>
                    <div className="font-mono font-bold text-green-600 text-sm">{formatPrice(inv.total)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">Chi phí khác</h3>
                <input
                  type="date"
                  value={otherCostsDateFilter}
                  onChange={e => setOtherCostsDateFilter(e.target.value)}
                  className="p-1 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {otherCostsList.length === 0 ? (
                  <div className="text-gray-400 text-sm">Không có chi phí khác trong ngày này</div>
                ) : (
                  <div>
                    {otherCostsList.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <div className="font-bold text-sm text-gray-700">{inv.id}</div>
                          <div className="text-xs text-gray-500">{inv.time.split(',')[0]}</div>
                        </div>
                        <div className="font-mono font-bold text-purple-600 text-sm">{formatPrice(inv.otherCosts)}</div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-800">Tổng cộng:</span>
                      <span className="font-mono font-bold text-purple-700 text-lg">
                        {formatPrice(otherCostsList.reduce((sum, inv) => sum + inv.otherCosts, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders tab */}
      {reportTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border p-1">
          <div className="p-3 border-b flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => { setOrderStatusTab('valid'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm ${orderStatusTab === 'valid' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Hợp lệ
              </button>
              <button
                onClick={() => { setOrderStatusTab('deleted'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm ${orderStatusTab === 'deleted' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Đã xóa / Trả hàng
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={orderDateFilter}
                onChange={e => { setOrderDateFilter(e.target.value); setCurrentPage(1); }}
                className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={e => { setOrderSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm theo mã đơn hoặc khách..."
                className="p-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                onClick={exportDoctorCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <i className="fa-solid fa-user-doctor"></i> Xuất DS BS
              </button>
              <button
                onClick={() => setShowExportCKModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <i className="fa-solid fa-file-export"></i> Xuất HD CK
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3">Mã HD</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Bác sĩ</th>
                  <th className="p-3">Nhân viên</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">Không tìm thấy đơn hàng</td></tr>
                ) : (
                  paginatedInvoices.map(inv => (
                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-teal-600">{inv.id}</td>
                      <td className="p-3 text-xs text-gray-500">{inv.time}</td>
                      <td className="p-3">{inv.customer.name}</td>
                      <td className="p-3 font-bold text-teal-700">{inv.customer.doctorName || '-'}</td>
                      <td className="p-3">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border">{inv.employeeName}</span>
                      </td>
                      <td className="p-3">
                        {inv.method === 'cash' ? (
                          <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">
                            <i className="fa-solid fa-money-bill mr-1"></i>Tiền mặt
                          </span>
                        ) : (
                          <span className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded">
                            <i className="fa-solid fa-qrcode mr-1"></i>CK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600 font-mono">{formatPrice(inv.total)}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-bold transition"
                        >
                          Xem
                        </button>
                        {orderStatusTab === 'valid' && (
                          <button
                            onClick={() => setInvoiceToDelete(inv.id)}
                            className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-bold transition"
                            title="Xóa/Trả hàng"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-3 border-t bg-gray-50 flex justify-between items-center gap-4 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <select
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="p-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-2">Tổng: <b>{filteredInvoices.length}</b></span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <span className="text-sm px-3 font-medium text-gray-700">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 border rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-sm"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingInvoice && (
        <DetailModal
          type="INV"
          data={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {showExportCKModal && (
        <ExportCKModal onClose={() => setShowExportCKModal(false)} />
      )}

      {invoiceToDelete && (
        <ConfirmModal
          title="Xác nhận xóa hóa đơn"
          message="Bạn có chắc chắn muốn xóa/trả lại hóa đơn này? Sản phẩm sẽ được hoàn lại kho và doanh thu sẽ bị trừ."
          onConfirm={handleDeleteInvoice}
          onCancel={() => setInvoiceToDelete(null)}
        />
      )}
    </div>
  );
}
