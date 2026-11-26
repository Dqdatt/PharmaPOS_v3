// Hàm dùng chung cho Edge Functions đọc dữ liệu.
export const TZ = 'Asia/Ho_Chi_Minh';
export const vnDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD
export const vnToday = () => vnDate();

// Đọc hết (PostgREST cắt ở max_rows: thiếu dòng = sai tiền)
// deno-lint-ignore no-explicit-any
export async function all<T>(query: () => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}
