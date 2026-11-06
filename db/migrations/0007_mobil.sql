-- 0007_mobil: crawl_log cihaz ayrimi
ALTER TABLE crawl_log ADD COLUMN mobil TINYINT(1) NOT NULL DEFAULT 0 AFTER bot;

-- rollback
ALTER TABLE crawl_log DROP COLUMN mobil;