-- 0009: renk generated column yolunu duzelt (colors JSON ic ice)
ALTER TABLE skins DROP INDEX ix_renk;
ALTER TABLE skins DROP COLUMN renk;
ALTER TABLE skins ADD COLUMN renk VARCHAR(7)
  GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(colors, '$.colors.primary.main'))) STORED AFTER colors;
ALTER TABLE skins ADD KEY ix_renk (renk);

-- rollback
ALTER TABLE skins DROP INDEX ix_renk;
ALTER TABLE skins DROP COLUMN renk;
ALTER TABLE skins ADD COLUMN renk VARCHAR(7)
  GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(colors, '$.primary.main'))) STORED AFTER colors;
ALTER TABLE skins ADD KEY ix_renk (renk);