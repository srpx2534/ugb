-- 0013: dis yonlendirici kaldirildi, hedef alan bosaltildi
ALTER TABLE brands MODIFY url VARCHAR(500) NULL;
UPDATE brands SET url = NULL;

-- rollback
UPDATE brands SET url = CONCAT('https://', slug, '.com');
ALTER TABLE brands MODIFY url VARCHAR(500) NOT NULL;