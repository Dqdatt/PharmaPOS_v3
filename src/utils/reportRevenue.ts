export interface ReportInvoice {
  time: string;
  otherCosts: number;
  total: number;
  status?: string;
}

export interface ReportExportOrder {
  date: string;
  status: string;
  total: number;
}

export const parseReportDateToISO = (timeStr: string) => {
  if (!timeStr) return '';

  const isoMatch = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const parts = timeStr.split(/[\s,]+/);
  const dateStr = parts.find(p => p.includes('/'));
  if (!dateStr) return '';

  const [d, m, y] = dateStr.split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const getValidRetailInvoices = <T extends ReportInvoice>(invoices: T[]): T[] =>
  invoices.filter(inv => inv.status !== 'deleted');

export const getPaidExportOrders = <T extends ReportExportOrder>(exportOrders: T[]): T[] =>
  exportOrders.filter(order => order.status === 'paid');

export const getReportRevenueSummary = (
  invoices: ReportInvoice[],
  exportOrders: ReportExportOrder[],
) => {
  const validRetailInvoices = getValidRetailInvoices(invoices);
  const paidExportOrders = getPaidExportOrders(exportOrders);
  const retailRevenue = validRetailInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const exportRevenue = paidExportOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    retailRevenue,
    exportRevenue,
    totalRevenue: retailRevenue + exportRevenue,
  };
};

export const getRetailCalendarRevenue = (invoices: ReportInvoice[]) => {
  const data: Record<string, number> = {};

  getValidRetailInvoices(invoices).forEach(inv => {
    const dateIso = parseReportDateToISO(inv.time);
    if (!dateIso) return;
    data[dateIso] = (data[dateIso] || 0) + inv.total - inv.otherCosts;
  });

  return data;
};

export const getRetailRevenueForDate = <T extends ReportInvoice>(invoices: T[], dateIso: string) => {
  const invoicesOnDate = getValidRetailInvoices(invoices).filter(
    inv => parseReportDateToISO(inv.time) === dateIso,
  );
  const otherCosts = invoicesOnDate.reduce((sum, inv) => sum + inv.otherCosts, 0);
  const grossRevenue = invoicesOnDate.reduce((sum, inv) => sum + inv.total, 0);

  return {
    invoices: invoicesOnDate,
    otherCosts,
    grossRevenue,
    netRevenue: grossRevenue - otherCosts,
  };
};
