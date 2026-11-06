-- 0011: marka slug, kendi yonlendiricimiz
ALTER TABLE brands ADD COLUMN slug VARCHAR(190) NULL AFTER ad;
UPDATE brands SET slug = LOWER(REPLACE(ad, ' ', '-')) WHERE slug IS NULL;
ALTER TABLE brands MODIFY slug VARCHAR(190) NOT NULL;
ALTER TABLE brands ADD UNIQUE KEY uq_slug (slug);
UPDATE brands SET url = CONCAT('/l/', slug);

-- rollback
UPDATE brands SET url = CONCAT('https://link.merkezemoji.com/', slug);
ALTER TABLE brands DROP INDEX uq_slug;
ALTER TABLE brands DROP COLUMN slug;