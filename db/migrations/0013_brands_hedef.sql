-- 0013: dis yonlendirici kaldirildi, hedef alan bosaltildi
ALTER TABLE brands MODIFY url VARCHAR(500) NULL;
UPDATE brands SET url = NULL;

-- rollback
UPDATE brands SET url = slug;
ALTER TABLE brands MODIFY url VARCHAR(500) NOT NULL;