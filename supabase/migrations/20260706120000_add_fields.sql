-- Thêm trường thanh toán cho phiếu nhập
ALTER TABLE purchases ADD COLUMN payment_method TEXT DEFAULT 'cash';

-- Thêm bác sĩ cho đơn bán hàng
ALTER TABLE invoices ADD COLUMN doctor_name TEXT;

-- Thêm địa chỉ và ghi chú cho đơn xuất kho
ALTER TABLE export_orders ADD COLUMN customer_address TEXT;
ALTER TABLE export_orders ADD COLUMN customer_note TEXT;

-- Thêm ghi chú cho đơn bán hàng (nếu chưa có)
-- ALTER TABLE invoices ADD COLUMN note TEXT; -- (sẽ kiểm tra sau xem có chưa)
