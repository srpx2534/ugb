-- 0012: url gercek hedefe donuyor (hub /l/<slug> -> url)
UPDATE brands SET url = CONCAT('https://link.merkezemoji.com/', slug);

-- rollback
UPDATE brands SET url = CONCAT('/l/', slug);