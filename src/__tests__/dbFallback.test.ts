import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDbErrorMessage, shouldRetryWithLegacyPayload, writeWithLegacyFallback } from '../utils/dbFallback';

describe('database legacy fallback guards', () => {
  it('formats Supabase object errors instead of [object Object]', () => {
    const error = {
      message: "Could not find the 'payment_method' column",
      details: 'schema cache',
      code: 'PGRST204',
    };

    assert.equal(
      getDbErrorMessage(error),
      "Could not find the 'payment_method' column | schema cache | PGRST204",
    );
  });

  it('allows invoice fallback only for optional invoice columns', () => {
    assert.equal(
      shouldRetryWithLegacyPayload('invoice', { message: "Could not find the 'doctor_name' column" }),
      true,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('invoice', { message: "Could not find the 'total' column" }),
      false,
    );
  });

  it('allows purchase fallback for optional purchase workflow columns', () => {
    assert.equal(
      shouldRetryWithLegacyPayload('purchase', { message: "Could not find the 'payment_method' column" }),
      true,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('purchase', { message: "Could not find the 'supplier_id' column" }),
      true,
    );
  });

  it('does not fallback purchase writes for money-critical columns', () => {
    assert.equal(
      shouldRetryWithLegacyPayload('purchase', { message: "Could not find the 'total' column" }),
      false,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('purchase', { message: "invalid input syntax for type numeric" }),
      false,
    );
  });

  it('allows export order fallback only for optional customer detail columns', () => {
    assert.equal(
      shouldRetryWithLegacyPayload('exportOrder', { message: "Could not find the 'customer_note' column" }),
      true,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('exportOrder', { message: "Could not find the 'other_costs' column" }),
      false,
    );
  });

  it('runs legacy write after optional purchase column failure', async () => {
    const calls: string[] = [];
    const originalWarn = console.warn;
    console.warn = () => undefined;
    try {
      await writeWithLegacyFallback(
        'purchase',
        async () => {
          calls.push('primary');
          return { error: { message: "Could not find the 'payment_method' column" } };
        },
        async () => {
          calls.push('legacy');
          return { error: null };
        },
        'retry purchase',
      );
    } finally {
      console.warn = originalWarn;
    }

    assert.deepEqual(calls, ['primary', 'legacy']);
  });

  it('does not run legacy write for non-optional money-related failures', async () => {
    const calls: string[] = [];

    await assert.rejects(
      writeWithLegacyFallback(
        'purchase',
        async () => {
          calls.push('primary');
          return { error: { message: "Could not find the 'total' column" } };
        },
        async () => {
          calls.push('legacy');
          return { error: null };
        },
        'retry purchase',
      ),
    );

    assert.deepEqual(calls, ['primary']);
  });

  it('throws if the legacy retry also fails', async () => {
    const originalWarn = console.warn;
    console.warn = () => undefined;
    try {
      await assert.rejects(
        writeWithLegacyFallback(
          'invoice',
          async () => ({ error: { message: "Could not find the 'doctor_name' column" } }),
          async () => ({ error: { message: 'duplicate key value violates unique constraint' } }),
          'retry invoice',
        ),
        (error: unknown) => getDbErrorMessage(error).includes('duplicate key value'),
      );
    } finally {
      console.warn = originalWarn;
    }
  });
});
