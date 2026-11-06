-- 0014: gecici hedefler (10. adimda linkcheck ile dogrulanacak)
UPDATE brands SET url = CONCAT('https://', slug, '.com') WHERE url IS NULL;

-- rollback
UPDATE brands SET url = NULL;