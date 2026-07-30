import { createDbTimestamp } from './dbFallback';

export type PurchasePaymentMode = 'cash' | 'transfer' | 'debt' | 'preserve';

interface PreviousPurchasePayment {
  status?: 'CREATED' | 'DEBT' | 'COMPLETED';
  paymentMethod?: string;
  debtAt?: string;
  paymentRequestedAt?: string;
  paidAt?: string;
  lockedAt?: string;
}

export const resolvePurchasePaymentFields = (
  mode: PurchasePaymentMode,
  previous: PreviousPurchasePayment = {},
  timestamp = createDbTimestamp(),
) => {
  if (mode === 'debt') {
    return {
      status: 'DEBT' as const,
      paymentMethod: undefined,
      debtAt: timestamp,
      paymentRequestedAt: previous.paymentRequestedAt,
      paidAt: previous.paidAt,
      lockedAt: previous.lockedAt,
    };
  }

  if (mode === 'cash' || mode === 'transfer') {
    return {
      status: 'COMPLETED' as const,
      paymentMethod: mode,
      debtAt: previous.debtAt,
      paymentRequestedAt: previous.paymentRequestedAt,
      paidAt: timestamp,
      lockedAt: timestamp,
    };
  }

  return {
    status: previous.status || 'CREATED' as const,
    paymentMethod: previous.paymentMethod,
    debtAt: previous.debtAt,
    paymentRequestedAt: previous.paymentRequestedAt,
    paidAt: previous.paidAt,
    lockedAt: previous.lockedAt,
  };
};
