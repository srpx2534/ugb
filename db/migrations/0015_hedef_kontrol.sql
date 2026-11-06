-- 0015: hedef dogrulama durumu
ALTER TABLE brands ADD COLUMN dogrulandi TINYINT(1) NOT NULL DEFAULT 0 AFTER url;
ALTER TABLE brands ADD COLUMN son_kontrol TIMESTAMP NULL AFTER dogrulandi;

-- rollback
ALTER TABLE brands DROP COLUMN son_kontrol;
ALTER TABLE brands DROP COLUMN dogrulandi;