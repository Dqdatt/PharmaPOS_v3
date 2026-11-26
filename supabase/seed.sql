-- Seed data for PharmaPOS V3 (MediPOS) local development

-- USERS: Claude sẽ sửa ở bước auth, không thêm logic khác vào đây
INSERT INTO public.users (id, name, role, pin) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Nguyễn Văn Quản', 'admin', '1234'),
  (2, 'Trần Thị Lan', 'staff', '1234'),
  (3, 'Lê Minh Tú', 'staff', '1234');
SELECT setval(pg_get_serial_sequence('public.users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.users));

-- Nhà cung cấp (2 nhà cung cấp)
INSERT INTO public.suppliers (id, code, name, bank_name, account_number, account_name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'NCC01', 'Công ty Dược phẩm Trung Ương 1', 'Vietcombank', '0011001234567', 'CTY DUOC PHAM TW1'),
  (2, 'NCC02', 'Công ty CP Dược Hậu Giang', 'BIDV', '3111000987654', 'CTY CP DUOC HAU GIANG');
SELECT setval(pg_get_serial_sequence('public.suppliers', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.suppliers));

-- Sản phẩm thuốc phổ biến tại Việt Nam (15 sản phẩm, tồn kho ban đầu đủ lớn)
INSERT INTO public.products (id, name, category, unit, import_price, sell_price, initial_stock, total_in, total_out) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Paracetamol 500mg (Hapacol)', 'Thuốc giảm đau - Hạ sốt', 'Hộp', 15000, 25000, 300, 0, 0),
  (2, 'Amoxicillin 500mg', 'Kháng sinh', 'Hộp', 42000, 65000, 250, 0, 0),
  (3, 'Augmentin 625mg', 'Kháng sinh', 'Hộp', 165000, 210000, 200, 0, 0),
  (4, 'Cefuroxim 500mg', 'Kháng sinh', 'Hộp', 85000, 120000, 200, 0, 0),
  (5, 'Omeprazol 20mg', 'Tiêu hóa', 'Hộp', 28000, 45000, 250, 0, 0),
  (6, 'Smecta (Bột pha uống)', 'Tiêu hóa', 'Hộp', 95000, 125000, 220, 0, 0),
  (7, 'Berberin BM 100mg', 'Tiêu hóa', 'Lọ', 12000, 20000, 300, 0, 0),
  (8, 'Loratadin 10mg', 'Dị ứng', 'Hộp', 18000, 30000, 250, 0, 0),
  (9, 'Cetirizin 10mg', 'Dị ứng', 'Hộp', 20000, 35000, 250, 0, 0),
  (10, 'Bromhexin 8mg', 'Hô hấp', 'Hộp', 16000, 28000, 280, 0, 0),
  (11, 'Siro ho Prospan 100ml', 'Hô hấp', 'Chai', 62000, 85000, 200, 0, 0),
  (12, 'Vitamin C 500mg', 'Vitamin & Khoáng chất', 'Hộp', 25000, 40000, 350, 0, 0),
  (13, 'Oresol 245 (Gói bù nước)', 'Vitamin & Khoáng chất', 'Hộp', 22000, 35000, 300, 0, 0),
  (14, 'Nước muối sinh lý NaCl 0.9% 500ml', 'Vật tư y tế', 'Chai', 6000, 12000, 400, 0, 0),
  (15, 'Bông y tế Bạch Tuyết 100g', 'Vật tư y tế', 'Gói', 14000, 22000, 300, 0, 0);
SELECT setval(pg_get_serial_sequence('public.products', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.products));

-- 3 phiếu nhập hàng + chi tiết (trigger sẽ tự cộng total_in)
DO $$
DECLARE
  v_ts TIMESTAMPTZ;
BEGIN
  v_ts := now() - INTERVAL '25 days';
  INSERT INTO public.purchases (id, date, supplier, supplier_id, status, payment_method, note, total, created_at)
  VALUES ('PN100001', to_char(v_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY'), 'Công ty Dược phẩm Trung Ương 1', 1, 'COMPLETED', 'transfer', 'Nhập bổ sung đầu tháng', 0, v_ts);
  INSERT INTO public.purchase_items (purchase_id, product_id, name, unit, qty, cost) VALUES
    ('PN100001', 1, 'Paracetamol 500mg (Hapacol)', 'Hộp', 50, 15000),
    ('PN100001', 2, 'Amoxicillin 500mg', 'Hộp', 30, 42000),
    ('PN100001', 12, 'Vitamin C 500mg', 'Hộp', 40, 25000);
  UPDATE public.purchases SET total = (SELECT COALESCE(SUM(qty * cost), 0) FROM public.purchase_items WHERE purchase_id = 'PN100001') WHERE id = 'PN100001';

  v_ts := now() - INTERVAL '14 days';
  INSERT INTO public.purchases (id, date, supplier, supplier_id, status, payment_method, note, total, created_at)
  VALUES ('PN100002', to_char(v_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY'), 'Công ty CP Dược Hậu Giang', 2, 'COMPLETED', 'cash', 'Nhập hàng tiêu hóa - hô hấp', 0, v_ts);
  INSERT INTO public.purchase_items (purchase_id, product_id, name, unit, qty, cost) VALUES
    ('PN100002', 5, 'Omeprazol 20mg', 'Hộp', 30, 28000),
    ('PN100002', 6, 'Smecta (Bột pha uống)', 'Hộp', 20, 95000),
    ('PN100002', 11, 'Siro ho Prospan 100ml', 'Chai', 25, 62000);
  UPDATE public.purchases SET total = (SELECT COALESCE(SUM(qty * cost), 0) FROM public.purchase_items WHERE purchase_id = 'PN100002') WHERE id = 'PN100002';

  v_ts := now() - INTERVAL '5 days';
  INSERT INTO public.purchases (id, date, supplier, supplier_id, status, payment_method, note, total, created_at)
  VALUES ('PN100003', to_char(v_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY'), 'Công ty Dược phẩm Trung Ương 1', 1, 'DEBT', 'transfer', 'Nhập vật tư và kháng sinh', 0, v_ts);
  INSERT INTO public.purchase_items (purchase_id, product_id, name, unit, qty, cost) VALUES
    ('PN100003', 3, 'Augmentin 625mg', 'Hộp', 15, 165000),
    ('PN100003', 14, 'Nước muối sinh lý NaCl 0.9% 500ml', 'Chai', 60, 6000),
    ('PN100003', 15, 'Bông y tế Bạch Tuyết 100g', 'Gói', 40, 14000);
  UPDATE public.purchases SET total = (SELECT COALESCE(SUM(qty * cost), 0) FROM public.purchase_items WHERE purchase_id = 'PN100003') WHERE id = 'PN100003';
END $$;

-- 40 hóa đơn trải đều 30 ngày gần nhất, chia cho user 1/2/3, mỗi hóa đơn 1-4 dòng
DO $$
DECLARE
  i INTEGER;
  j INTEGER;
  v_item_count INTEGER;
  v_emp_id BIGINT;
  v_emp_name TEXT;
  v_method TEXT;
  v_inv_id TEXT;
  v_ts TIMESTAMPTZ;
  v_time_str TEXT;
  v_prod RECORD;
  v_qty INTEGER;
  v_total NUMERIC;
  v_cust_names TEXT[] := ARRAY[
    'Khách lẻ', 'Nguyễn Thị Mai', 'Trần Văn Hùng', 'Phạm Minh Anh',
    'Lê Thị Hương', 'Hoàng Văn Nam', 'Vũ Thị Thảo', 'Đặng Quốc Bảo'
  ];
BEGIN
  FOR i IN 1..40 LOOP
    v_emp_id := ((i - 1) % 3) + 1;
    SELECT name INTO v_emp_name FROM public.users WHERE id = v_emp_id;

    v_method := CASE WHEN i % 3 = 0 THEN 'transfer' ELSE 'cash' END;
    v_inv_id := 'HD' || lpad((100000 + i)::TEXT, 6, '0');
    -- Trải đều từ 29 ngày trước đến hôm nay
    v_ts := now() - ((30.0 * (40 - i) / 40.0) * INTERVAL '1 day') - (((i * 37) % 480) * INTERVAL '1 minute');
    v_time_str := to_char(v_ts AT TIME ZONE 'Asia/Ho_Chi_Minh', 'HH24:MI:SS DD/MM/YYYY');

    INSERT INTO public.invoices (
      id, time, employee_name, employee_id,
      customer_name, customer_phone, method, other_costs, total, status, created_at
    ) VALUES (
      v_inv_id,
      v_time_str,
      v_emp_name,
      v_emp_id,
      v_cust_names[((i - 1) % array_length(v_cust_names, 1)) + 1],
      CASE WHEN i % 2 = 0 THEN '09' || lpad((10000000 + i * 12345)::TEXT, 8, '0') ELSE '' END,
      v_method,
      0,
      0,
      'completed',
      v_ts
    );

    v_item_count := ((i - 1) % 4) + 1;
    v_total := 0;

    FOR j IN 1..v_item_count LOOP
      SELECT id, name, unit, sell_price
      INTO v_prod
      FROM public.products
      WHERE id = (((i * 3 + j * 2 - 1) % 15) + 1);

      v_qty := ((i + j) % 3) + 1;

      INSERT INTO public.invoice_items (
        invoice_id, product_id, name, unit, price, qty, created_at
      ) VALUES (
        v_inv_id, v_prod.id, v_prod.name, v_prod.unit, v_prod.sell_price, v_qty, v_ts
      );

      v_total := v_total + (v_prod.sell_price * v_qty);
    END LOOP;

    UPDATE public.invoices SET total = v_total WHERE id = v_inv_id;
  END LOOP;
END $$;
