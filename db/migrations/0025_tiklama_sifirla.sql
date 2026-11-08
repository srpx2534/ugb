-- 0025: ip_hash tuzlu semaya gecti; tuzsuz eski kayitlarla korelasyon kurulamiyor.
-- Tiklama verisi analitik nitelikte, sifirlanmasi kabul edildi.
-- TRUNCATE: FK clicks tarafinda (domains'e referans), engellenmez.
TRUNCATE TABLE clicks;

-- rollback
-- Geri alinamaz: TRUNCATE veriyi tutmaz, yalnizca tabloyu bosaltir.
TRUNCATE TABLE clicks;