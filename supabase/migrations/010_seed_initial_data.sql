-- ============================================================
-- 010_seed_initial_data.sql
-- Data awal Laundry POS
-- ============================================================

-- ------------------------------------------------------------
-- 1. OUTLET
-- ------------------------------------------------------------

INSERT INTO outlets (
    id,
    name,
    address,
    phone
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Outlet Pusat',
    'Jl. Contoh No. 1',
    '021-0000000'
)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 2. MITRA
-- ------------------------------------------------------------

INSERT INTO mitra (
    id,
    name,
    owner_name,
    email,
    phone,
    status,
    commission_pct
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Mitra Sentosa',
    'Budi Santoso',
    'mitra@laundry.id',
    '081234567890',
    'approved',
    10
)
ON CONFLICT (id) DO NOTHING;