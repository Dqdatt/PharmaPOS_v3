import { useState } from 'react';
import { usePos, Invoice } from '../contexts/PosContext';
import DetailModal from '../components/modals/DetailModal';
import ExportCKModal from '../components/modals/ExportCKModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { showNotification } from '../utils/toast';

export default function Reports() {
  const { invoices, products, getStock, formatPrice, deleteInvoice } = usePos();
  const [reportTab, setReportTab] = useState<'overview' | 'orders'>('overview');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showExportCKModal, setShowExportCKModal] = useState(false);
  const [orderStatusTab, setOrderStatusTab] = useState<'valid' | 'deleted'>('valid');
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const validInvoices = invoices.filter(inv => inv.status !== 'deleted');

  const totalRevenue = validInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalProfit = validInvoices.reduce((sum, inv) => {
    const costOfGoods = inv.items.reduce((s, i) => {
      const p = products.find(x => x.id === i.id);
      return s + (p ? p.importPrice : 0) * i.qty;
    }, 0);
    return sum + (inv.total - costOfGoods);
  }, 0);
  const inventoryValue = products.reduce((sum, p) => sum + getStock(p) * p.importPrice, 0);

  const topProducts = (() => {
    const salesMap: Record<string, number> = {};
    validInvoices.forEach(inv => {
      inv.items.forEach(i => {
        salesMap[i.name] = (salesMap[i.name] || 0) + i.price * i.qty;
      });
    });
    return Object.entries(salesMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  })();

  const filteredInvoices = invoices.filter(i => {
    const matchSearch = i.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                        i.customer.name.toLowerCase().includes(orderSearchQuery.toLowerCase());
    const matchStatus = orderStatusTab === 'valid' ? i.status !== 'deleted' : i.status === 'deleted';
    return matchSearch && matchStatus;
  });

  const parseInvDateToISO = (timeStr: string) => {
    const parts = timeStr.split(/[\s,]+/); 
    const dateStr = parts.find(p => p.includes('/'));
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const invoicesToday = validInvoices.filter(inv => parseInvDateToISO(inv.time) === todayISO);
  const otherCostsToday = invoicesToday.reduce((sum, inv) => sum + inv.otherCosts, 0);
  const totalRevenueToday = invoicesToday.reduce((sum, inv) => sum + inv.total, 0);
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
      console.error(e);
      showNotification('Có lỗi khi xóa hóa đơn', 'error');
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
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-teal-500">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Tổng doanh thu</h3>
              <div className="text-2xl font-bold text-teal-700 font-mono">{formatPrice(totalRevenue)}</div>
              <div className="text-xs text-gray-400 mt-2">Toàn thời gian</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Doanh thu ngày</h3>
              <div className="text-2xl font-bold text-green-700 font-mono">{formatPrice(netRevenueToday)}</div>
              <div className="text-xs text-gray-400 mt-2">Trừ chi phí khác</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Chi phí khác (Hôm nay)</h3>
              <div className="text-2xl font-bold text-purple-700 font-mono">{formatPrice(otherCostsToday)}</div>
              <div className="text-xs text-gray-400 mt-2">Tổng phụ phí hôm nay</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Số đơn hàng</h3>
              <div className="text-2xl font-bold text-blue-700 font-mono">{validInvoices.length}</div>
              <div className="text-xs text-gray-400 mt-2">Đơn hàng hợp lệ</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500">
              <h3 className="text-gray-500 text-xs font-bold mb-1 uppercase">Giá trị tồn kho</h3>
              <div className="text-2xl font-bold text-amber-700 font-mono">{formatPrice(inventoryValue)}</div>
              <div className="text-xs text-gray-400 mt-2">Tính theo giá nhập</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Top Sản phẩm bán chạy</h3>
              {topProducts.length === 0 ? (
                <div className="text-gray-400 text-sm">Chưa có dữ liệu</div>
              ) : (
                topProducts.map(tp => (
                  <div key={tp.name} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate pr-2">{tp.name}</span>
                      <span className="font-mono font-bold text-teal-600">{formatPrice(tp.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{ width: `${(tp.revenue / topProducts[0].revenue * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
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
                onClick={() => setOrderStatusTab('valid')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm ${orderStatusTab === 'valid' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Hợp lệ
              </button>
              <button
                onClick={() => setOrderStatusTab('deleted')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm ${orderStatusTab === 'deleted' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Đã xóa / Trả hàng
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                placeholder="Tìm theo mã đơn hoặc khách..."
                className="p-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
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
                  <th className="p-3">Nhân viên</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Không tìm thấy đơn hàng</td></tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-teal-600">{inv.id}</td>
                      <td className="p-3 text-xs text-gray-500">{inv.time}</td>
                      <td className="p-3">{inv.customer.name}</td>
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
