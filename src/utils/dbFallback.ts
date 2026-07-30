export type LegacyFallbackTarget = 'invoice' | 'purchase' | 'exportOrder';

const optionalColumnsByTarget: Record<LegacyFallbackTarget, string[]> = {
  invoice: ['customer_address', 'doctor_name', 'note'],
  purchase: [
    'supplier_id',
    'status',
    'payment_method',
    'debt_at',
    'payment_requested_at',
    'paid_at',
    'locked_at',
  ],
  exportOrder: ['customer_address', 'customer_note'],
};

export const getDbErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const message = [maybeError.message, maybeError.details, maybeError.hint, maybeError.code]
      .filter(Boolean)
      .map(String)
      .join(' | ');
    return message || JSON.stringify(error);
  }
  return String(error);
};

export const shouldRetryWithLegacyPayload = (target: LegacyFallbackTarget, error: unknown) => {
  const message = getDbErrorMessage(error).toLowerCase();
  return optionalColumnsByTarget[target].some(column => message.includes(column));
};

type DbWriteResult = { error: unknown | null };

export const writeWithLegacyFallback = async (
  target: LegacyFallbackTarget,
  primaryWrite: () => PromiseLike<DbWriteResult>,
  legacyWrite: () => PromiseLike<DbWriteResult>,
  warningMessage: string,
) => {
  const { error } = await primaryWrite();
  if (!error) return;

  if (!shouldRetryWithLegacyPayload(target, error)) throw error;

  console.warn(warningMessage, error);
  const { error: retryError } = await legacyWrite();
  if (retryError) throw retryError;
};
