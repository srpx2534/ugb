-- 0017: elle kapatma isareti (linkcheck aktif alanini ezmesin)
ALTER TABLE domains ADD COLUMN elle_kapali TINYINT(1) NOT NULL DEFAULT 0 AFTER aktif;
ALTER TABLE brands ADD COLUMN elle_kapali TINYINT(1) NOT NULL DEFAULT 0 AFTER aktif;

-- rollback
ALTER TABLE brands DROP COLUMN elle_kapali;
ALTER TABLE domains DROP COLUMN elle_kapali;