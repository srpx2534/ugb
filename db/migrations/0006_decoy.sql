-- 0006_decoy: domain basina decoy kimligi
ALTER TABLE domains ADD COLUMN decoy JSON NULL AFTER seed;

-- rollback
ALTER TABLE domains DROP COLUMN decoy;