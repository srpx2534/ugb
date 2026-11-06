-- 0016: makale aciklamasi saklaniyor
ALTER TABLE articles ADD COLUMN aciklama VARCHAR(320) NULL AFTER baslik;

-- rollback
ALTER TABLE articles DROP COLUMN aciklama;