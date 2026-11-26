// Đọc hết mọi dòng: PostgREST cắt ở max_rows (1000) → thiếu dòng = sai doanh thu. Giống `all()` của Edge Functions.
// query phải có order theo cột duy nhất (vd thêm .order('id')) để các trang không trùng/sót dòng.
export async function selectAll<T = any>(query: () => any, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query().range(from, from + pageSize - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) return out;
  }
}
