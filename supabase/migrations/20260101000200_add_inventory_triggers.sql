-- KỊCH BẢN TẠO DATABASE TRIGGERS ĐỂ QUẢN LÝ TỒN KHO TỰ ĐỘNG
-- Hãy copy toàn bộ nội dung dưới đây và dán vào Supabase SQL Editor, sau đó nhấn "RUN"

-------------------------------------------------------------------------------
-- 1. TRIGGERS CHO HÓA ĐƠN BÁN LẺ (INVOICES)
-------------------------------------------------------------------------------

-- 1.1 Hàm tăng `total_out` khi có chi tiết hóa đơn mới được thêm
CREATE OR REPLACE FUNCTION trg_invoice_items_insert() RETURNS trigger AS $$
DECLARE
  inv_status TEXT;
BEGIN
  SELECT status INTO inv_status FROM invoices WHERE id = NEW.invoice_id;
  -- Nếu hóa đơn tồn tại và không phải là 'deleted'
  IF inv_status IS NULL OR inv_status <> 'deleted' THEN
    UPDATE products SET total_out = total_out + NEW.qty WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_items_insert ON invoice_items;
CREATE TRIGGER trigger_invoice_items_insert
AFTER INSERT ON invoice_items
FOR EACH ROW EXECUTE FUNCTION trg_invoice_items_insert();

-- 1.2 Hàm trả lại `total_out` khi hóa đơn chuyển sang trạng thái 'deleted'
CREATE OR REPLACE FUNCTION trg_invoice_status_change() RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'deleted' AND NEW.status = 'deleted' THEN
    UPDATE products p
    SET total_out = p.total_out - i.qty
    FROM invoice_items i
    WHERE i.invoice_id = NEW.id AND p.id = i.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_status_update ON invoices;
CREATE TRIGGER trigger_invoice_status_update
AFTER UPDATE OF status ON invoices
FOR EACH ROW EXECUTE FUNCTION trg_invoice_status_change();


-------------------------------------------------------------------------------
-- 2. TRIGGERS CHO ĐƠN NHẬP KHO (PURCHASES)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_purchase_items() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET total_in = total_in + NEW.qty, import_price = NEW.cost WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET total_in = total_in - OLD.qty WHERE id = OLD.product_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products SET total_in = total_in - OLD.qty + NEW.qty, import_price = NEW.cost WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_items ON purchase_items;
CREATE TRIGGER trigger_purchase_items
AFTER INSERT OR UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION trg_purchase_items();


-------------------------------------------------------------------------------
-- 3. TRIGGERS CHO ĐƠN XUẤT KHO (EXPORT ORDERS)
-------------------------------------------------------------------------------

-- 3.1 Cập nhật khi Thêm/Xóa chi tiết xuất kho (Ví dụ lúc sửa đơn xuất)
CREATE OR REPLACE FUNCTION trg_export_order_items() RETURNS trigger AS $$
DECLARE
  ord_status TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO ord_status FROM export_orders WHERE id = NEW.export_order_id;
    IF ord_status IS NULL OR ord_status <> 'returned' THEN
      UPDATE products SET total_out = total_out + NEW.qty WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT status INTO ord_status FROM export_orders WHERE id = OLD.export_order_id;
    -- Khi cha bị xóa cascade, ord_status có thể là NULL, chúng ta vẫn trả kho nếu nó NULL 
    -- vì nếu nó đã là 'returned' từ trước, hàm trigger status đã tự lo rồi.
    IF ord_status IS NULL OR ord_status <> 'returned' THEN
      UPDATE products SET total_out = total_out - OLD.qty WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT status INTO ord_status FROM export_orders WHERE id = NEW.export_order_id;
    IF ord_status IS NULL OR ord_status <> 'returned' THEN
      UPDATE products SET total_out = total_out - OLD.qty + NEW.qty WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_export_order_items ON export_order_items;
CREATE TRIGGER trigger_export_order_items
AFTER INSERT OR UPDATE OR DELETE ON export_order_items
FOR EACH ROW EXECUTE FUNCTION trg_export_order_items();


-- 3.2 Cập nhật khi Trạng thái xuất kho thay đổi sang HOÀN ĐƠN (returned) và ngược lại
CREATE OR REPLACE FUNCTION trg_export_order_status() RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'returned' AND NEW.status = 'returned' THEN
    -- Đổi thành hoàn đơn: Trừ đi số lượng đã xuất
    UPDATE products p
    SET total_out = p.total_out - i.qty
    FROM export_order_items i
    WHERE i.export_order_id = NEW.id AND p.id = i.product_id;
  ELSIF OLD.status = 'returned' AND NEW.status <> 'returned' THEN
    -- Hủy hoàn đơn (đổi sang trạng thái khác): Cộng lại số lượng xuất
    UPDATE products p
    SET total_out = p.total_out + i.qty
    FROM export_order_items i
    WHERE i.export_order_id = NEW.id AND p.id = i.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_export_order_status ON export_orders;
CREATE TRIGGER trigger_export_order_status
AFTER UPDATE OF status ON export_orders
FOR EACH ROW EXECUTE FUNCTION trg_export_order_status();

-- 3.3 Để an toàn khi xóa hẳn đơn (DELETE trên export_orders)
-- Khi xóa export_orders, export_order_items sẽ bị xóa theo (CASCADE).
-- Trigger `trg_export_order_items` ở phía trên đã xử lý trả kho khi DELETE child items.
-- Nên chúng ta không cần viết thêm Trigger BEFORE DELETE cho parent table.
