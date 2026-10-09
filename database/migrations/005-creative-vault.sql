-- =============================================================================
-- 005 — The Creative Vault (creative.markui.lk)
--
-- The in-depth portfolio: each Vault project has its own page made of
-- sections (videos, posters, galleries, the live website …), kept as JSON in
-- vault_projects.blocks. vault_albums caches the photos listed from Google
-- Drive folders and Google Photos albums, vault_media is the library of files
-- uploaded for the Vault, and projects.vault_project_id links a main-site
-- project to its Vault page.
--
-- Run once against an existing database:
--   mysql -u root -p markui < database/migrations/005-creative-vault.sql
--
-- A database created from database/schema.sql already has all of this.
-- Running it twice fails with "already exists" and changes nothing.
-- =============================================================================

CREATE TABLE vault_projects (
  id             VARCHAR(64)  NOT NULL,
  slug           VARCHAR(191) NOT NULL,
  previous_slugs JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- old slugs redirect here
  title          TEXT         NOT NULL,
  client         TEXT         NOT NULL DEFAULT (''),
  service_id     VARCHAR(64)  NOT NULL DEFAULT '',            -- services.id, soft link
  template       VARCHAR(64)  NOT NULL DEFAULT 'general',
  summary        TEXT         NOT NULL DEFAULT (''),
  location       TEXT         NOT NULL DEFAULT (''),
  project_date   DATE,
  cover          JSON,                                         -- {kind, media}
  accent         VARCHAR(7)   NOT NULL DEFAULT '',
  facts          JSON         NOT NULL DEFAULT (JSON_ARRAY()), -- [{label, value}]
  links          JSON         NOT NULL DEFAULT (JSON_ARRAY()), -- [{label, url}]
  blocks         JSON         NOT NULL DEFAULT (JSON_ARRAY()), -- the sections, in order
  status         ENUM('draft', 'unlisted', 'published') NOT NULL DEFAULT 'draft',
  featured       BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order     INT          NOT NULL DEFAULT 0,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at   DATETIME(3),
  PRIMARY KEY (id),
  UNIQUE KEY vault_projects_slug_uq (slug),
  KEY vault_projects_public_idx (status, featured, sort_order),
  CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c'))
) ENGINE = InnoDB;

CREATE TABLE vault_albums (
  source_key VARCHAR(191) NOT NULL,                  -- drive:<folderId> | gphotos:<link>
  source_url TEXT         NOT NULL,
  status     ENUM('idle', 'syncing', 'ready', 'error') NOT NULL DEFAULT 'idle',
  error      TEXT,
  items      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  synced_at  DATETIME(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (source_key)
) ENGINE = InnoDB;

CREATE TABLE vault_media (
  id          VARCHAR(64)  NOT NULL,
  url         TEXT         NOT NULL,                 -- /media/vault/<file>
  kind        ENUM('image', 'video', 'pdf', 'file') NOT NULL,
  name        TEXT         NOT NULL,                 -- the original file name
  mime        VARCHAR(127) NOT NULL DEFAULT '',
  bytes       BIGINT       NOT NULL DEFAULT 0,
  width       INT,
  height      INT,
  poster_url  TEXT,                                  -- a video's first frame
  display_url TEXT,                                  -- web copy (HEIC, TIFF, large images)
  thumb_url   TEXT,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY vault_media_created_idx (created_at)
) ENGINE = InnoDB;

ALTER TABLE projects
  ADD COLUMN vault_project_id VARCHAR(64) AFTER portfolio_url;
