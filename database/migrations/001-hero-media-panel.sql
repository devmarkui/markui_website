-- =============================================================================
-- 001 — Media Production in the Home hero
--
-- The hero's "What we do" list went from two entries (IT Solutions, Digital
-- Marketing) to three, adding Media Production. This adds the columns that
-- third entry is edited into, matching database/schema.sql.
--
-- Run once against an existing database:
--   mysql -u root -p markui < database/migrations/001-hero-media-panel.sql
--
-- A database created from database/schema.sql already has these columns, so
-- this migration is only for databases made before the change. Running it
-- twice fails with "Duplicate column name" and changes nothing.
-- =============================================================================

ALTER TABLE site_settings
  ADD COLUMN media_title       VARCHAR(255) NOT NULL DEFAULT 'Media Production' AFTER marketing_link,
  ADD COLUMN media_description TEXT         NOT NULL DEFAULT ('')               AFTER media_title,
  ADD COLUMN media_link        TEXT         NOT NULL DEFAULT ('/services/multimedia-production') AFTER media_description;

UPDATE site_settings
   SET media_description = 'Photography, video and multimedia production that gives your brand something worth showing.',
       media_link        = '/services/multimedia-production'
 WHERE id = 1
   AND media_description = '';
