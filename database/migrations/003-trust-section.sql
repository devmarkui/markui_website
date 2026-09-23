-- =============================================================================
-- 003 — Trust strip on the Home page
--
-- The band under the hero (headline, scrolling client names, stat cards) used
-- to be hard-coded in components/sections/home/Trust.tsx. It is now edited in
-- the dashboard under Trust & Stats, so it needs somewhere to live.
--
-- Run once against an existing database:
--   mysql -u root -p markui < database/migrations/003-trust-section.sql
--
-- A database created from database/schema.sql already has these columns.
-- Running it twice fails with "Duplicate column name" and changes nothing.
-- =============================================================================

ALTER TABLE site_settings
  ADD COLUMN trust_heading_dark  TEXT NOT NULL DEFAULT ('')              AFTER media_link,
  ADD COLUMN trust_heading_muted TEXT NOT NULL DEFAULT ('')              AFTER trust_heading_dark,
  ADD COLUMN trust_stats         JSON NOT NULL DEFAULT (JSON_ARRAY())    AFTER trust_heading_muted,
  ADD COLUMN trust_logos         JSON NOT NULL DEFAULT (JSON_ARRAY())    AFTER trust_stats;

-- Seed the row with exactly what the page showed before it became editable.
UPDATE site_settings
   SET trust_heading_dark  = 'DESIGN\nTHAT WORKS',
       trust_heading_muted = 'RESULTS\nTHAT LAST',
       trust_stats = '[{"label":"Client Satisfaction","value":"100%","suffix":"","description":"Trusted by growing digital teams"},
                       {"label":"Experience","value":"8+","suffix":"Years","description":"Designing scalable digital products"},
                       {"label":"Delivered Projects","value":"60+","suffix":"","description":"Across SaaS, AI & digital platforms"},
                       {"label":"Growth Impact","value":"+40%","suffix":"","description":"Average ROI growth after new design"}]',
       trust_logos = '[{"name":"Prisma","icon":"◭"},{"name":"Vertex","icon":"⬡"},{"name":"Lumina","icon":"◈"},
                       {"name":"Nexus","icon":"⊠"},{"name":"Courto","icon":"⊡"},{"name":"Orbital","icon":"◎"},
                       {"name":"Vanta","icon":"●"}]'
 WHERE id = 1
   AND trust_heading_dark = '';
