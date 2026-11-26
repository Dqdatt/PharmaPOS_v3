import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { selectAll } from '../utils/selectAll';

// Giả lập PostgREST: trả tối đa max dòng mỗi lần dù range xin nhiều hơn.
const fakeTable = (rows: number[], max = 3, failAt?: number) => () => ({
  range: async (from: number, to: number) =>
    from === failAt ? { data: null, error: new Error('mất mạng') } : { data: rows.slice(from, Math.min(to + 1, from + max)), error: null },
});

describe('selectAll', () => {
  it('đọc hết qua nhiều trang, không trùng không sót', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => i);
    assert.deepEqual(await selectAll(fakeTable(rows), 3), rows);
  });

  it('số dòng chia hết cho trang vẫn dừng đúng', async () => {
    const rows = [1, 2, 3, 4, 5, 6];
    assert.deepEqual(await selectAll(fakeTable(rows), 3), rows);
  });

  it('bảng rỗng trả mảng rỗng', async () => {
    assert.deepEqual(await selectAll(fakeTable([]), 3), []);
  });

  it('lỗi ở trang giữa thì ném lỗi, không trả dữ liệu thiếu', async () => {
    await assert.rejects(selectAll(fakeTable([1, 2, 3, 4, 5], 3, 3), 3), /mất mạng/);
  });
});
