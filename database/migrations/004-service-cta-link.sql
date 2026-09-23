-- =============================================================================
-- 004 — A custom link for each "Explore service" button
--
-- The button on the Services page always pointed at /services/<slug>. It can
-- now be aimed somewhere else per service, set in the dashboard under
-- Services. Left blank, the button keeps going to the detail page as before.
--
-- Run once against an existing database:
--   mysql -u root -p markui < database/migrations/004-service-cta-link.sql
--
-- A database created from database/schema.sql already has this column.
-- Running it twice fails with "Duplicate column name" and changes nothing.
-- =============================================================================

ALTER TABLE services
  ADD COLUMN cta_link TEXT NOT NULL DEFAULT ('') AFTER tags;
