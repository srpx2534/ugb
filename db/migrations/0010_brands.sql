-- 0010: marka havuzu (url'ler 8. adimda /l/<slug> ile degisecek)
INSERT INTO brands (ad, url, teklif, aktif) VALUES
  ('Ultrabet',   'https://link.merkezemoji.com/ultrabet',   '5.000 TL', 1),
  ('Trbet',      'https://link.merkezemoji.com/trbet',      '4.500 TL', 1),
  ('Ecobet',     'https://link.merkezemoji.com/ecobet',     '3.500 TL', 1),
  ('Maxloto',    'https://link.merkezemoji.com/maxloto',    '2.000 TL', 1),
  ('Bahisking',  'https://link.merkezemoji.com/bahisking',  '1.250 TL', 1),
  ('Tipobet',    'https://link.merkezemoji.com/tipobet',    '1.001 TL', 1),
  ('Sahabet',    'https://link.merkezemoji.com/sahabet',    '2.000 TL', 1),
  ('Betwoon',    'https://link.merkezemoji.com/betwoon',    '7.777 TL', 1),
  ('Onwin',      'https://link.merkezemoji.com/onwin',      '2.000 TL', 1),
  ('Royalbet',   'https://link.merkezemoji.com/royalbet',   '2.500 TL', 1)
ON DUPLICATE KEY UPDATE teklif = VALUES(teklif), url = VALUES(url);

-- rollback
DELETE FROM brands WHERE ad IN ('Ultrabet','Trbet','Ecobet','Maxloto','Bahisking','Tipobet','Sahabet','Betwoon','Onwin','Royalbet');