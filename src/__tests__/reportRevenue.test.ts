import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getReportRevenueSummary,
  getRetailCalendarRevenue,
  getRetailRevenueForDate,
  parseReportDateToISO,
} from '../utils/reportRevenue';

describe('report revenue buckets', () => {
  const invoices = [
    { time: '10:00:00 13/8/2026', otherCosts: 10_000, total: 110_000 },
    { time: '11:00:00 13/8/2026', otherCosts: 0, total: 90_000 },
    { time: '12:00:00 13/8/2026', otherCosts: 0, total: 999_000, status: 'deleted' },
    { time: '09:00:00 14/8/2026', otherCosts: 5_000, total: 55_000 },
  ];

  const exportOrders = [
    { date: '10:30:00 13/8/2026', status: 'paid', total: 300_000, paymentMethod: 'cash' },
    { date: '10:45:00 13/8/2026', status: 'paid', total: 400_000, paymentMethod: 'transfer' },
    { date: '11:00:00 13/8/2026', status: 'pending_payment', total: 500_000, paymentMethod: 'cash' },
    { date: '12:00:00 13/8/2026', status: 'returned', total: 600_000, paymentMethod: 'transfer' },
  ];

  it('keeps paid export cash and transfer revenue out of retail day revenue', () => {
    const dayRevenue = getRetailRevenueForDate(invoices, '2026-08-13');

    assert.equal(dayRevenue.grossRevenue, 200_000);
    assert.equal(dayRevenue.otherCosts, 10_000);
    assert.equal(dayRevenue.netRevenue, 190_000);
  });

  it('keeps paid export revenue out of the daily retail calendar', () => {
    assert.deepEqual(getRetailCalendarRevenue(invoices), {
      '2026-08-13': 190_000,
      '2026-08-14': 50_000,
    });
  });

  it('adds paid export cash and transfer revenue only to export and total revenue', () => {
    const summary = getReportRevenueSummary(invoices, exportOrders);

    assert.equal(summary.retailRevenue, 255_000);
    assert.equal(summary.exportRevenue, 700_000);
    assert.equal(summary.totalRevenue, 955_000);
  });

  it('parses both Vietnamese and ISO date strings', () => {
    assert.equal(parseReportDateToISO('10:31:11 13/8/2026'), '2026-08-13');
    assert.equal(parseReportDateToISO('2026-08-13T03:31:11.000Z'), '2026-08-13');
  });
});
