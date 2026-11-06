-- 0001_init: cekirdek sema
SET NAMES utf8mb4;

CREATE TABLE clusters (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kod        VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kod (kod)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE skins (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  site_id    TINYINT UNSIGNED NOT NULL,
  colors     JSON NOT NULL,
  renk       VARCHAR(7) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(colors, '$.primary.main'))) STORED,
  favicon    VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_site (site_id),
  KEY ix_renk (renk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brands (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ad         VARCHAR(120) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  teklif     VARCHAR(255) NULL,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ad (ad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE domains (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  host       VARCHAR(190) NOT NULL,
  role       ENUM('carrier','hub','spoke') NOT NULL,
  kume_id    INT UNSIGNED NULL,
  site_id    TINYINT UNSIGNED NULL,
  decoy_id   TINYINT UNSIGNED NULL,
  brand_id   INT UNSIGNED NULL,
  seed       INT UNSIGNED NULL,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_host (host),
  KEY ix_role_aktif (role, aktif),
  KEY ix_kume (kume_id),
  CONSTRAINT fk_dom_kume FOREIGN KEY (kume_id) REFERENCES clusters(id) ON DELETE SET NULL,
  CONSTRAINT fk_dom_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_assignment (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kume_id    INT UNSIGNED NOT NULL,
  domain_id  INT UNSIGNED NOT NULL,
  brand_id   INT UNSIGNED NOT NULL,
  slot       TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kume_brand (kume_id, brand_id),
  UNIQUE KEY uq_kume_slot (kume_id, slot),
  CONSTRAINT fk_ba_kume FOREIGN KEY (kume_id) REFERENCES clusters(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain_id    INT UNSIGNED NOT NULL,
  slug         VARCHAR(190) NOT NULL,
  seed         INT UNSIGNED NOT NULL,
  baslik       VARCHAR(255) NOT NULL,
  govde        MEDIUMTEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  yayinda      TINYINT(1) NOT NULL DEFAULT 1,
  lastmod      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_domain_slug (domain_id, slug),
  KEY ix_domain_hash (domain_id, content_hash),
  KEY ix_art_lastmod (domain_id, lastmod),
  CONSTRAINT fk_art_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_grams (
  article_id INT UNSIGNED NOT NULL,
  gram       CHAR(64) NOT NULL,
  PRIMARY KEY (article_id, gram),
  KEY ix_gram (gram),
  CONSTRAINT fk_ag_art FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE article_versions (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id   INT UNSIGNED NOT NULL,
  content_hash CHAR(64) NOT NULL,
  govde        MEDIUMTEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_av_art (article_id, created_at),
  CONSTRAINT fk_av_art FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE crawl_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain_id  INT UNSIGNED NOT NULL,
  ip         VARCHAR(45) NOT NULL,
  asn        INT UNSIGNED NULL,
  ua         VARCHAR(255) NULL,
  yol        VARCHAR(255) NOT NULL,
  durum      SMALLINT UNSIGNED NOT NULL,
  bot        TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_cl_domain_zaman (domain_id, created_at),
  KEY ix_cl_bot (bot, created_at),
  CONSTRAINT fk_cl_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE link_blocks (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain_id  INT UNSIGNED NOT NULL,
  sira       TINYINT UNSIGNED NOT NULL,
  anchor     VARCHAR(190) NOT NULL,
  hedef      VARCHAR(500) NOT NULL,
  tur        ENUM('marka','bolge','isletme','genel') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lb_domain_sira (domain_id, sira),
  CONSTRAINT fk_lb_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clicks (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain_id  INT UNSIGNED NOT NULL,
  brand_id   INT UNSIGNED NULL,
  slug       VARCHAR(190) NOT NULL,
  ip_hash    CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ck_domain_zaman (domain_id, created_at),
  CONSTRAINT fk_ck_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- rollback
DROP TABLE IF EXISTS clicks;
DROP TABLE IF EXISTS link_blocks;
DROP TABLE IF EXISTS crawl_log;
DROP TABLE IF EXISTS article_versions;
DROP TABLE IF EXISTS article_grams;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS brand_assignment;
DROP TABLE IF EXISTS domains;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS skins;
DROP TABLE IF EXISTS clusters;