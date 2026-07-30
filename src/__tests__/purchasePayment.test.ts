import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePurchasePaymentFields } from '../utils/purchasePayment';

describe('purchase payment flow state', () => {
  it('locks a purchase as completed when paying by cash', () => {
    const payment = resolvePurchasePaymentFields('cash', {}, '2026-07-30T04:00:00.000Z');

    assert.equal(payment.status, 'COMPLETED');
    assert.equal(payment.paymentMethod, 'cash');
    assert.equal(payment.paidAt, '2026-07-30T04:00:00.000Z');
    assert.equal(payment.lockedAt, '2026-07-30T04:00:00.000Z');
  });

  it('locks a purchase as completed only after transfer is confirmed', () => {
    const payment = resolvePurchasePaymentFields('transfer', {}, '2026-07-30T04:01:00.000Z');

    assert.equal(payment.status, 'COMPLETED');
    assert.equal(payment.paymentMethod, 'transfer');
    assert.equal(payment.paidAt, '2026-07-30T04:01:00.000Z');
    assert.equal(payment.lockedAt, '2026-07-30T04:01:00.000Z');
  });

  it('moves a purchase to debt without marking it paid', () => {
    const payment = resolvePurchasePaymentFields('debt', {}, '2026-07-30T04:02:00.000Z');

    assert.equal(payment.status, 'DEBT');
    assert.equal(payment.paymentMethod, undefined);
    assert.equal(payment.debtAt, '2026-07-30T04:02:00.000Z');
    assert.equal(payment.paidAt, undefined);
    assert.equal(payment.lockedAt, undefined);
  });

  it('preserves existing payment fields while editing purchase details', () => {
    const payment = resolvePurchasePaymentFields('preserve', {
      status: 'DEBT',
      paymentMethod: undefined,
      debtAt: '2026-07-30T04:03:00.000Z',
    });

    assert.equal(payment.status, 'DEBT');
    assert.equal(payment.debtAt, '2026-07-30T04:03:00.000Z');
    assert.equal(payment.paidAt, undefined);
  });
});
