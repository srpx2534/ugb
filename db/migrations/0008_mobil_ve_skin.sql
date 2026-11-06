-- 0008: mobil kopya isareti, kume icinde skin benzersizligi, m.* kaydi
ALTER TABLE domains ADD COLUMN mobil TINYINT(1) NOT NULL DEFAULT 0 AFTER decoy_id;
ALTER TABLE domains ADD UNIQUE KEY uq_kume_site (kume_id, site_id);

INSERT INTO clusters (kod) VALUES ('kume-1')
  ON DUPLICATE KEY UPDATE kod = VALUES(kod);

INSERT INTO domains (host, role, kume_id, mobil, seed) VALUES ('m.hedefa.com', 'carrier', 1, 1, 777001)
  ON DUPLICATE KEY UPDATE mobil = VALUES(mobil);

-- rollback
DELETE FROM domains WHERE host = 'm.hedefa.com';
ALTER TABLE domains DROP INDEX uq_kume_site;
ALTER TABLE domains DROP COLUMN mobil;