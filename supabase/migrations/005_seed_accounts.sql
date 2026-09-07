CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1. Outlet & Mitra contoh (supaya admin/mitra seed punya cabang)
-- ------------------------------------------------------------
INSERT INTO outlets (id, name, address, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Outlet Pusat', 'Jl. Contoh No. 1', '021-0000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mitra (id, name, owner_name, email, phone, status, commission_pct)
VALUES ('00000000-0000-0000-0000-000000000002', 'Mitra Sentosa', 'Budi Santoso', 'mitra@laundry.id', '0812xxxxxxx', 'approved', 10)
ON CONFLICT (id) DO NOTHING;