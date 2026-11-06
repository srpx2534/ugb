-- 0021: refresh kuyrugu icin imlec; RAND() yerine sirayla dolasilir
ALTER TABLE domains ADD COLUMN refresh_at TIMESTAMP NULL DEFAULT NULL AFTER elle_kapali;
ALTER TABLE domains ADD KEY ix_refresh (refresh_at);

-- rollback
ALTER TABLE domains DROP INDEX ix_refresh;
ALTER TABLE domains DROP COLUMN refresh_at;