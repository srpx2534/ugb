ALTER TABLE brands
  ADD COLUMN dikey varchar(32) NOT NULL DEFAULT 'bonus' AFTER teklif,
  ADD KEY idx_brands_dikey_aktif (dikey, aktif);

-- rollback
ALTER TABLE brands
  DROP KEY idx_brands_dikey_aktif,
  DROP COLUMN dikey;