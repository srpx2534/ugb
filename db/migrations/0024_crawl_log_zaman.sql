-- 0024: created_at tek basina indeksli degildi; haftalik budama tam tarama yapiyordu
ALTER TABLE crawl_log ADD KEY ix_cl_zaman (created_at);

-- rollback
ALTER TABLE crawl_log DROP INDEX ix_cl_zaman;