-- Cách uống (Sáng / Trưa / Chiều-Tối) per sold/exported item.
-- Additive and nullable: existing rows and older app builds are unaffected,
-- and inventory triggers (which only read qty/product_id) are untouched.
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS dosage jsonb;
ALTER TABLE public.export_order_items ADD COLUMN IF NOT EXISTS dosage jsonb;

NOTIFY pgrst, 'reload schema';
