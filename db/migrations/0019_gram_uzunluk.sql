-- 0019: 5-gram 64 karakteri asabiliyor (olculen 58), kolonu genislet
ALTER TABLE article_grams MODIFY gram VARCHAR(100) NOT NULL;

-- rollback
ALTER TABLE article_grams MODIFY gram CHAR(64) NOT NULL;