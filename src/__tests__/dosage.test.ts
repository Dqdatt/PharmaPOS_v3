import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DOSAGE_OPTIONS,
  formatDosage,
  fromDbDosage,
  getPrintableDosage,
  hasDosage,
  keepDosePhraseTogether,
  normalizeSearch,
  toDbDosage,
} from '../utils/dosage';
import { shouldRetryWithLegacyPayload, writeWithLegacyFallback } from '../utils/dbFallback';

describe('cách uống (dosage)', () => {
  it('matches the agreed suggestion lists, with Tối 1 gói instead of Tối 2 gói', () => {
    assert.deepEqual(DOSAGE_OPTIONS.sang, [
      'Sáng 1 viên trước ăn 30 phút', 'Sáng 1 viên', 'Sáng 2 viên', 'Sáng ½ viên', 'Sáng 1 gói',
    ]);
    assert.deepEqual(DOSAGE_OPTIONS.trua, ['Trưa 1 viên', 'Trưa 2 viên', 'Trưa ½ viên', 'Trưa 1 gói']);
    assert.ok(DOSAGE_OPTIONS.chieu.includes('Chiều 1 gói'));
    assert.ok(DOSAGE_OPTIONS.chieu.includes('Tối 1 gói'));
    assert.ok(!DOSAGE_OPTIONS.chieu.includes('Tối 2 gói'));
  });

  it('formats filled slots on one line in Sáng → Trưa → Chiều/Tối order', () => {
    assert.equal(
      formatDosage({ sang: 'Sáng 1 viên', trua: '', chieu: ' Chiều 1 viên ' }),
      'Sáng 1 viên – Chiều 1 viên',
    );
    assert.equal(formatDosage({ sang: '', trua: 'Trưa 1 gói', chieu: '' }), 'Trưa 1 gói');
    assert.equal(formatDosage(undefined), '');
  });

  it('prints nothing when the toggle is off, even if slots were filled', () => {
    const dosage = { sang: 'Sáng 1 viên', trua: '', chieu: '' };
    assert.equal(getPrintableDosage({ dosageEnabled: false, dosage }), '');
    assert.equal(getPrintableDosage({ dosage }), '');
    assert.equal(getPrintableDosage({ dosageEnabled: true, dosage }), 'Sáng 1 viên');
    assert.equal(getPrintableDosage({ dosageEnabled: true, dosage: { sang: ' ', trua: '', chieu: '' } }), '');
  });

  it('stores null unless the toggle is on and at least one slot is filled', () => {
    const dosage = { sang: ' Sáng 2 viên ', trua: '', chieu: 'Tối 1 viên' };
    assert.equal(toDbDosage(false, dosage), null);
    assert.equal(toDbDosage(undefined, dosage), null);
    assert.equal(toDbDosage(true, { sang: '', trua: '  ', chieu: '' }), null);
    assert.equal(toDbDosage(true, undefined), null);
    assert.deepEqual(toDbDosage(true, dosage), { sang: 'Sáng 2 viên', trua: '', chieu: 'Tối 1 viên' });
  });

  it('reads the database column defensively', () => {
    assert.equal(fromDbDosage(null), undefined);
    assert.equal(fromDbDosage(undefined), undefined);
    assert.equal(fromDbDosage('Sáng 1 viên'), undefined);
    assert.equal(fromDbDosage({ sang: '', trua: '', chieu: '' }), undefined);
    assert.deepEqual(fromDbDosage({ sang: 'Sáng 1 viên', extra: 1 }), { sang: 'Sáng 1 viên', trua: '', chieu: '' });
    assert.equal(hasDosage({ trua: 'Trưa ½ viên' }), true);
  });

  it('keeps dose phrases together without making the whole line unbreakable', () => {
    const nb = '\u00A0';
    assert.equal(keepDosePhraseTogether('Tối 1 gói'), `Tối${nb}1${nb}gói`);
    assert.equal(keepDosePhraseTogether('Trưa ½ viên'), `Trưa${nb}½${nb}viên`);
    assert.equal(
      keepDosePhraseTogether('Sáng 1 viên trước ăn 30 phút'),
      `Sáng${nb}1${nb}viên trước ăn 30${nb}phút`,
    );
  });

  it('searches suggestions without Vietnamese accents', () => {
    assert.ok(normalizeSearch('Sáng 1 viên trước ăn').includes(normalizeSearch('sang 1 vien truoc')));
    assert.ok(normalizeSearch('Chiều ½ viên').includes(normalizeSearch('chieu')));
    assert.equal(normalizeSearch('Đêm'), 'dem');
  });

  it('falls back to saving items without dosage only when the dosage column is missing', async () => {
    assert.equal(
      shouldRetryWithLegacyPayload('invoiceItems', { message: "Could not find the 'dosage' column of 'invoice_items' in the schema cache" }),
      true,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('exportOrderItems', { message: "Could not find the 'dosage' column of 'export_order_items'" }),
      true,
    );
    assert.equal(
      shouldRetryWithLegacyPayload('invoiceItems', { message: 'null value in column "qty" violates not-null constraint' }),
      false,
    );

    const calls: string[] = [];
    await writeWithLegacyFallback(
      'invoiceItems',
      async () => {
        calls.push('primary');
        return { error: { message: "Could not find the 'dosage' column", code: 'PGRST204' } };
      },
      async () => {
        calls.push('legacy');
        return { error: null };
      },
      'test warning',
    );
    assert.deepEqual(calls, ['primary', 'legacy']);
  });
});
