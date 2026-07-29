-- Thêm trường thanh toán cho phiếu nhập
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Thêm thông tin khách hàng, bác sĩ và ghi chú cho đơn bán hàng
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note TEXT;

-- Thêm địa chỉ và ghi chú cho đơn xuất kho
ALTER TABLE export_orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE export_orders ADD COLUMN IF NOT EXISTS customer_note TEXT;
