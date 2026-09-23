-- =============================================================================
-- 002 — Enquiries
--
-- The Contact page form and the Home page form used to do nothing. They now
-- store each submission here and then email it on, so a mail outage never
-- loses an enquiry. Matches the `enquiries` table in database/schema.sql.
--
-- Run once against an existing database:
--   mysql -u root -p markui < database/migrations/002-enquiries.sql
--
-- A database created from database/schema.sql already has this table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS enquiries (
  id          VARCHAR(64)  NOT NULL DEFAULT (UUID()),
  source      VARCHAR(16)  NOT NULL,                  -- 'contact' | 'home'
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(200) NOT NULL DEFAULT (''),
  phone       VARCHAR(40)  NOT NULL DEFAULT (''),
  company     VARCHAR(160) NOT NULL DEFAULT (''),
  service     VARCHAR(120) NOT NULL DEFAULT (''),
  message     TEXT         NOT NULL,
  emailed     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY enquiries_created_idx (created_at),
  CHECK (source IN ('contact', 'home')),
  CHECK (email <> '' OR phone <> '')
) ENGINE = InnoDB;
