INSERT IGNORE INTO brands (ad, slug, teklif, dikey, aktif) VALUES
  ('Taraftarium24', 'taraftarium24', 'Kesintisiz HD', 'canli-mac', 1),
  ('Selçuk Sports', 'selcuksports', 'Mobil uyumlu', 'canli-mac', 1),
  ('Justin TV', 'justintv', 'Hızlı açılış', 'canli-mac', 1),
  ('Falcon TV', 'falcontv', 'Yedek link', 'canli-mac', 1),
  ('Sportz TV', 'sportztv', '4K yayın', 'canli-mac', 1),
  ('Maçkolik Yayın', 'mackolik-yayin', 'Tüm ligler', 'canli-mac', 1),
  ('Kanal Spor', 'kanalspor', 'Şifresiz', 'canli-mac', 1),
  ('Tribün Yayın', 'tribun-yayin', 'Reklamsız', 'canli-mac', 1),
  ('Gol TV', 'goltv', 'Düşük gecikme', 'canli-mac', 1),
  ('Arena Live', 'arenalive', 'HD 1080p', 'canli-mac', 1),
  ('Saha İçi', 'saha-ici', 'Kesintisiz HD', 'canli-mac', 1),
  ('Deplasmanda', 'deplasmanda', 'Mobil uyumlu', 'canli-mac', 1);

-- rollback
DELETE FROM brands WHERE dikey = 'canli-mac';