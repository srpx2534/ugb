-- 0018: decoy kimlikleri ayri tabloya tasindi
CREATE TABLE decoys (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  isim       VARCHAR(120) NOT NULL,
  tur        VARCHAR(80) NOT NULL,
  adres      VARCHAR(190) NOT NULL,
  sehir      VARCHAR(80) NOT NULL,
  bolge      VARCHAR(8) NOT NULL,
  posta      VARCHAR(12) NOT NULL,
  tel        VARCHAR(32) NOT NULL,
  eposta     VARCHAR(120) NOT NULL,
  hakkinda   TEXT NOT NULL,
  saatler    JSON NOT NULL,
  menu       JSON NOT NULL,
  fotolar    TINYINT UNSIGNED NOT NULL DEFAULT 6,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO decoys (isim, tur, adres, sehir, bolge, posta, tel, eposta, hakkinda, saatler, menu, fotolar) VALUES
('Rittenhouse Grill', 'Kebap & Grill', '21258 E Rittenhouse Rd', 'Queen Creek', 'AZ', '85142', '(480) 555-0134', 'info@rittenhousegrill.example',
 'Family owned since 2016. Charcoal-grilled sis kebab, adana and lahmacun, cooked to order. Parking on site, two minutes from Rittenhouse Road.',
 '{"Monday":"11:00 - 21:00","Tuesday":"11:00 - 21:00","Wednesday":"11:00 - 21:00","Thursday":"11:00 - 21:00","Friday":"11:00 - 22:00","Saturday":"11:00 - 22:00","Sunday":"12:00 - 20:00"}',
 '[{"ad":"Adana Kebab","fiyat":"$18"},{"ad":"Sis Kebab","fiyat":"$19"},{"ad":"Lahmacun","fiyat":"$6"},{"ad":"Iskender","fiyat":"$21"},{"ad":"Lentil Soup","fiyat":"$5"},{"ad":"Baklava","fiyat":"$7"}]', 6),
('Copper State Pizza Co.', 'Pizza', '1140 E Speedway Blvd', 'Tucson', 'AZ', '85719', '(520) 555-0177', 'hello@copperstatepizza.example',
 'Neighborhood pizza shop since 2014. Hand-stretched dough, 48-hour cold ferment, Arizona-grown tomatoes. Slices until close, delivery within four miles.',
 '{"Monday":"11:00 - 22:00","Tuesday":"11:00 - 22:00","Wednesday":"11:00 - 22:00","Thursday":"11:00 - 23:00","Friday":"11:00 - 23:00","Saturday":"12:00 - 23:00","Sunday":"12:00 - 21:00"}',
 '[{"ad":"Cheese Slice","fiyat":"$4"},{"ad":"Pepperoni Pie","fiyat":"$19"},{"ad":"Copper Supreme","fiyat":"$24"},{"ad":"Garlic Knots","fiyat":"$6"},{"ad":"Caesar Salad","fiyat":"$9"},{"ad":"Cannoli","fiyat":"$5"}]', 5),
('Mesa Sunrise Diner', 'Breakfast & Diner', '225 W Main St', 'Mesa', 'AZ', '85201', '(480) 555-0192', 'orders@mesasunrise.example',
 'Classic counter diner since 2011. Buttermilk pancakes, chorizo hash, bottomless drip coffee. Counter seats first come first served, booths by phone.',
 '{"Monday":"06:00 - 14:00","Tuesday":"06:00 - 14:00","Wednesday":"06:00 - 14:00","Thursday":"06:00 - 14:00","Friday":"06:00 - 15:00","Saturday":"06:00 - 15:00","Sunday":"07:00 - 13:00"}',
 '[{"ad":"Buttermilk Stack","fiyat":"$11"},{"ad":"Chorizo Hash","fiyat":"$14"},{"ad":"Two Egg Plate","fiyat":"$9"},{"ad":"Biscuits & Gravy","fiyat":"$10"},{"ad":"Drip Coffee","fiyat":"$3"},{"ad":"Cinnamon Roll","fiyat":"$5"}]', 4);

-- tasiyici sayisi kimlik sayisini asarsa kimlikleri cogalt (uq_decoy tekillik ister)
SET @tasiyici := (SELECT COUNT(*) FROM domains WHERE role = 'carrier' AND mobil = 0);
SET @kimlik := (SELECT COUNT(*) FROM decoys);
SET @eksik := @tasiyici - @kimlik;

INSERT INTO decoys (isim, tur, adres, sehir, bolge, posta, tel, eposta, hakkinda, saatler, menu, fotolar)
SELECT CONCAT(isim, ' II'), tur, adres, sehir, bolge, posta, tel, eposta, hakkinda, saatler, menu, fotolar
FROM decoys
WHERE @eksik > 0 AND id <= @eksik;

-- eski JSON kimlikleri tasi
UPDATE domains SET decoy_id = 1 WHERE decoy IS NOT NULL;

-- tasiyicilara sirayla, benzersiz dagit
UPDATE domains d
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM domains WHERE role = 'carrier' AND mobil = 0
) x ON x.id = d.id
SET d.decoy_id = x.rn;

ALTER TABLE domains ADD UNIQUE KEY uq_decoy (decoy_id);
ALTER TABLE domains DROP COLUMN decoy;

-- rollback
ALTER TABLE domains ADD COLUMN decoy JSON NULL AFTER seed;
UPDATE domains d JOIN decoys c ON c.id = d.decoy_id
SET d.decoy = JSON_OBJECT(
  'isim', c.isim, 'tur', c.tur, 'adres', c.adres, 'sehir', c.sehir, 'bolge', c.bolge,
  'posta', c.posta, 'tel', c.tel, 'eposta', c.eposta, 'hakkinda', c.hakkinda,
  'saatler', c.saatler, 'menu', c.menu, 'fotolar', c.fotolar
);
ALTER TABLE domains DROP INDEX uq_decoy;
UPDATE domains SET decoy_id = NULL;
DROP TABLE decoys;