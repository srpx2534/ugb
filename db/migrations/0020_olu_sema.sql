-- 0020: kullanilmayan brand_id ve brand_assignment kaldirildi
ALTER TABLE domains DROP FOREIGN KEY fk_dom_brand;
ALTER TABLE domains DROP COLUMN brand_id;
DROP TABLE brand_assignment;

-- rollback
CREATE TABLE brand_assignment (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kume_id    INT UNSIGNED NOT NULL,
  domain_id  INT UNSIGNED NOT NULL,
  brand_id   INT UNSIGNED NOT NULL,
  slot       TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kume_brand (kume_id, brand_id),
  UNIQUE KEY uq_kume_slot (kume_id, slot),
  CONSTRAINT fk_ba_kume FOREIGN KEY (kume_id) REFERENCES clusters(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE domains ADD COLUMN brand_id INT UNSIGNED NULL AFTER decoy_id;
ALTER TABLE domains ADD CONSTRAINT fk_dom_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;