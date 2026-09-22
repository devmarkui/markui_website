-- =============================================================================
-- Mark UI website — MySQL schema
--
-- The site's content store (see lib/types.ts, read and written by lib/mysql-store.ts).
-- On first run the app imports the old .data/db.json into these tables.
-- Needs MySQL 8.0.16+ (CHECK constraints and expression defaults).
--
-- Run once (it creates the `markui` database):
--   mysql -u root -p < database/schema.sql
-- or open this file in MySQL Workbench and execute it.
--
-- Admin login is NOT stored here: it still comes from the ADMIN_* variables in
-- .env.local. Uploaded files are stored as URLs (e.g. /api/uploads/<id>.png or
-- a cloud-storage URL); the files themselves live on disk or in object storage.
--
-- Timestamps are DATETIME(3) in UTC — the app sets its session time zone to UTC.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS markui
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE markui;

-- ─── Services ────────────────────────────────────────────────────────────────
-- What the agency does. Each has a detail page at /services/<slug>.

CREATE TABLE services (
  id                VARCHAR(64)  NOT NULL DEFAULT (UUID()),
  slug              VARCHAR(191) NOT NULL,
  name              TEXT         NOT NULL,
  short_description TEXT         NOT NULL,
  full_description  TEXT         NOT NULL DEFAULT (''),
  image             TEXT         NOT NULL DEFAULT (''),     -- '' = use the icon
  icon              VARCHAR(32)  NOT NULL DEFAULT '◆',
  features          JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- "What we offer"
  benefits          JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- "Why choose this service"
  tags              JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  sort_order        INT          NOT NULL DEFAULT 0,
  active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY services_slug_uq (slug),
  KEY services_public_idx (active, sort_order),
  CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c'))
) ENGINE = InnoDB;

-- ─── Projects ────────────────────────────────────────────────────────────────
-- The portfolio. Detail page at /projects/<slug>.

CREATE TABLE projects (
  id               VARCHAR(64)  NOT NULL DEFAULT (UUID()),
  slug             VARCHAR(191) NOT NULL,
  title            TEXT         NOT NULL,
  description      TEXT         NOT NULL,                  -- short, for cards
  full_description TEXT,                                   -- "About the project"
  outcome          TEXT,                                   -- "Outcome / result"
  client           TEXT,
  category         ENUM('Web', 'Marketing', 'Multimedia', 'Branding') NOT NULL,
  image            TEXT         NOT NULL DEFAULT (''),     -- cover still / video poster
  cover_type       ENUM('image', 'video') NOT NULL DEFAULT 'image',
  cover_video      TEXT,                                   -- used when cover_type = 'video'
  link             TEXT,                                   -- live project ("Visit website")
  portfolio_url    TEXT,
  deliverables     JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- "What we did"
  featured         BOOLEAN      NOT NULL DEFAULT FALSE,
  active           BOOLEAN      NOT NULL DEFAULT TRUE,     -- false = hidden from the site
  project_date     DATE,
  industry         TEXT,
  tag              TEXT,                                   -- e.g. "/ web design"
  size             ENUM('large', 'small') NOT NULL DEFAULT 'small',
  sort_order       INT          NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY projects_slug_uq (slug),
  KEY projects_public_idx (active, sort_order),
  KEY projects_category_idx (category, active, sort_order),
  CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c')),
  CHECK (cover_type = 'image' OR cover_video IS NOT NULL)
) ENGINE = InnoDB;

-- Which services a project belongs to (Project.serviceIds).
CREATE TABLE project_services (
  project_id VARCHAR(64) NOT NULL,
  service_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (project_id, service_id),
  KEY project_services_service_idx (service_id),
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Ordered images/videos on the project detail page (Project.gallery).
CREATE TABLE project_gallery (
  id         VARCHAR(64) NOT NULL DEFAULT (UUID()),
  project_id VARCHAR(64) NOT NULL,
  type       ENUM('image', 'video') NOT NULL,
  title      TEXT        NOT NULL DEFAULT (''),
  image      TEXT        NOT NULL DEFAULT (''),            -- still, or video poster
  video      TEXT,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY project_gallery_idx (project_id, sort_order),
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CHECK (type = 'image' OR video IS NOT NULL)
) ENGINE = InnoDB;

-- Loose extra files kept on older projects (Project.media).
CREATE TABLE project_media (
  id         VARCHAR(64) NOT NULL DEFAULT (UUID()),
  project_id VARCHAR(64) NOT NULL,
  url        TEXT        NOT NULL,
  type       ENUM('image', 'video') NOT NULL,
  name       TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY project_media_idx (project_id, sort_order),
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ─── Service Top Work ────────────────────────────────────────────────────────
-- Highlighted work on one service's page. Either links a project (and borrows
-- its content) or carries its own title/copy/media.

CREATE TABLE top_work (
  id          VARCHAR(64) NOT NULL DEFAULT (UUID()),
  service_id  VARCHAR(64) NOT NULL,
  project_id  VARCHAR(64),
  title       TEXT        NOT NULL DEFAULT (''),           -- '' = use the project's
  description TEXT        NOT NULL DEFAULT (''),
  media_type  ENUM('image', 'video'),                      -- NULL = infer
  image       TEXT        NOT NULL DEFAULT (''),
  video       TEXT,
  category    TEXT,
  link        TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY top_work_service_idx (service_id, active, sort_order),
  KEY top_work_project_idx (project_id),
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  -- Deleting the project removes the highlight too, as the site does today.
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE top_work_media (
  id          VARCHAR(64) NOT NULL DEFAULT (UUID()),
  top_work_id VARCHAR(64) NOT NULL,
  url         TEXT        NOT NULL,
  type        ENUM('image', 'video') NOT NULL,
  name        TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY top_work_media_idx (top_work_id, sort_order),
  FOREIGN KEY (top_work_id) REFERENCES top_work (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ─── Products ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                VARCHAR(64)  NOT NULL DEFAULT (UUID()),
  slug              VARCHAR(191) NOT NULL,
  name              TEXT         NOT NULL,
  short_description TEXT         NOT NULL,
  full_description  TEXT         NOT NULL DEFAULT (''),
  image             TEXT         NOT NULL DEFAULT (''),
  logo              TEXT,
  icon              VARCHAR(32)  NOT NULL DEFAULT '▣',
  category          TEXT,                                  -- e.g. "Business software"
  status            ENUM('available', 'coming-soon', 'in-development') NOT NULL DEFAULT 'available',
  features          JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  technologies      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  price             TEXT,                                  -- free-form, e.g. "From LKR 45,000"
  link              TEXT,
  cta_label         TEXT,
  sort_order        INT          NOT NULL DEFAULT 0,
  active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY products_slug_uq (slug),
  KEY products_public_idx (active, sort_order),
  CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$', 'c'))
) ENGINE = InnoDB;

-- "Product Preview" screenshots and demo videos (Product.preview).
CREATE TABLE product_preview (
  id         VARCHAR(64) NOT NULL DEFAULT (UUID()),
  product_id VARCHAR(64) NOT NULL,
  type       ENUM('image', 'video') NOT NULL,
  title      TEXT        NOT NULL DEFAULT (''),
  image      TEXT        NOT NULL DEFAULT (''),
  video      TEXT,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY product_preview_idx (product_id, sort_order),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CHECK (type = 'image' OR video IS NOT NULL)
) ENGINE = InnoDB;

CREATE TABLE product_media (
  id         VARCHAR(64) NOT NULL DEFAULT (UUID()),
  product_id VARCHAR(64) NOT NULL,
  url        TEXT        NOT NULL,
  type       ENUM('image', 'video') NOT NULL,
  name       TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY product_media_idx (product_id, sort_order),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ─── Home: hero service cards ────────────────────────────────────────────────
-- The services each hero card (IT Solutions / Digital Marketing) rotates through.

CREATE TABLE hero_services (
  id           VARCHAR(64) NOT NULL DEFAULT (UUID()),
  panel        ENUM('it', 'marketing') NOT NULL,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  illustration ENUM('website', 'webapp', 'software', 'uiux', 'cloud', 'code',
                    'social', 'seo', 'ads', 'content', 'email', 'growth') NOT NULL DEFAULT 'code',
  image        TEXT,                                       -- uploaded icon, replaces the illustration
  link         TEXT,                                       -- NULL = the card's own link
  sort_order   INT         NOT NULL DEFAULT 0,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY hero_services_panel_idx (panel, active, sort_order),
  CHECK (CHAR_LENGTH(description) <= 140)
) ENGINE = InnoDB;

-- ─── Home: Latest From Our Studio ────────────────────────────────────────────

CREATE TABLE studio_items (
  id          VARCHAR(64) NOT NULL DEFAULT (UUID()),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT (''),
  media_type  ENUM('image', 'video') NOT NULL,
  image       TEXT        NOT NULL DEFAULT (''),           -- photo, or video poster
  video       TEXT,
  link        TEXT,                                        -- /site/path or https://…
  sort_order  INT         NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY studio_items_public_idx (active, sort_order),
  CHECK (media_type = 'image' OR video IS NOT NULL)
) ENGINE = InnoDB;

-- ─── Footer social links ─────────────────────────────────────────────────────

CREATE TABLE social_links (
  id         VARCHAR(64) NOT NULL DEFAULT (UUID()),
  label      TEXT        NOT NULL,                         -- e.g. "Instagram"
  url        TEXT        NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY social_links_order_idx (sort_order),
  CHECK (REGEXP_LIKE(url, '^https?://', 'i'))
) ENGINE = InnoDB;

-- ─── Site settings (single row) ──────────────────────────────────────────────
-- Home hero copy, About page copy and the portfolio link.
--
-- hero_heading / hero_description hold the rich-text JSON documents
-- ({"blocks":[{"runs":[{"text":"…","marks":{…}}],"align":…,"lineHeight":…}]}).
-- They are validated by lib/rich-text.ts before every save — never raw HTML.

CREATE TABLE site_settings (
  id                     SMALLINT     NOT NULL DEFAULT 1,
  portfolio_url          TEXT         NOT NULL DEFAULT (''),

  -- Home hero
  hero_heading           JSON         NOT NULL,
  hero_description       JSON         NOT NULL,
  cta_text               VARCHAR(255) NOT NULL DEFAULT 'Book a Call',
  cta_link               TEXT         NOT NULL DEFAULT ('/proposal'),
  cta_size               DECIMAL(4,1),
  cta_weight             SMALLINT,
  cta_color              VARCHAR(7),
  it_title               VARCHAR(255) NOT NULL DEFAULT 'IT Solutions',
  it_description         TEXT         NOT NULL DEFAULT (''),
  it_link                TEXT         NOT NULL DEFAULT ('/services/software-it-solutions'),
  marketing_title        VARCHAR(255) NOT NULL DEFAULT 'Digital Marketing',
  marketing_description  TEXT         NOT NULL DEFAULT (''),
  marketing_link         TEXT         NOT NULL DEFAULT ('/services/digital-marketing'),

  -- About page
  about_hero_heading     TEXT         NOT NULL,
  about_introduction     TEXT         NOT NULL,
  about_who_we_are       TEXT         NOT NULL,
  about_approach         JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- [{title, description}]
  about_reasons          JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- [{title, description}]
  about_expertise        JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- [{title, href}]
  about_values           JSON         NOT NULL DEFAULT (JSON_ARRAY()),  -- [{title, description}]
  about_cta_heading      TEXT         NOT NULL,
  about_cta_text         TEXT         NOT NULL,

  updated_at             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  CHECK (id = 1),
  CHECK (cta_size BETWEEN 9 AND 18),
  CHECK (cta_weight BETWEEN 100 AND 900 AND MOD(cta_weight, 100) = 0),
  CHECK (REGEXP_LIKE(cta_color, '^#[0-9a-f]{6}$', 'i')),
  CHECK (JSON_TYPE(JSON_EXTRACT(hero_heading, '$.blocks')) = 'ARRAY'),
  CHECK (JSON_TYPE(JSON_EXTRACT(hero_description, '$.blocks')) = 'ARRAY')
) ENGINE = InnoDB;

-- ─── Admin login (single row) ────────────────────────────────────────────────
-- Written by Admin → Account. While this table is empty, login uses the ADMIN_*
-- variables in .env.local. Deleting the row (or `npm run admin:setup`) falls
-- back to them again — the way back in after a forgotten password.
-- Sessions issued before updated_at are rejected, so a password change signs
-- out every other device.

CREATE TABLE admin_account (
  id            SMALLINT     NOT NULL DEFAULT 1,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,                     -- scrypt:<salt>:<hash>
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CHECK (id = 1)
) ENGINE = InnoDB;

-- ─── App bookkeeping ─────────────────────────────────────────────────────────
-- lib/db.ts records here that it has filled the tables (from .data/db.json or
-- the seed), so an admin who deletes everything is never re-seeded.

CREATE TABLE app_meta (
  meta_key   VARCHAR(64) NOT NULL,
  meta_value TEXT        NOT NULL,
  PRIMARY KEY (meta_key)
) ENGINE = InnoDB;

-- ─── Starting data ───────────────────────────────────────────────────────────

START TRANSACTION;

-- The one settings row, with the site's current defaults.
INSERT INTO site_settings (
  hero_heading, hero_description,
  it_description, marketing_description,
  about_hero_heading, about_introduction, about_who_we_are,
  about_approach, about_reasons, about_expertise, about_values,
  about_cta_heading, about_cta_text
) VALUES (
  '{"blocks":[{"runs":[{"text":"Less Noise"}]},{"runs":[{"text":"More Impact","marks":{"weight":800}}]}]}',
  '{"blocks":[{"runs":[{"text":"We help ambitious companies launch memorable brands, build high-impact websites, and design digital products people love to use."}]}]}',
  'Websites, web applications and custom software built around the way your business works.',
  'Social media, content and campaigns that help the right people find and choose you.',
  'We create\ndigital experiences\nthat matter.',
  'Mark UI is a creative technology company focused on building meaningful digital experiences, brands, products and solutions for modern businesses.',
  'Mark UI brings together design, technology, marketing and multimedia to help businesses build stronger digital experiences.\n\nWe work across strategy, branding, digital marketing, software, web development, photography and multimedia production.\n\nOur approach is simple: understand the problem, create the right solution and deliver work that creates real value.',
  '[{"title":"Discover","description":"Understand the business, audience and problem."},
    {"title":"Plan","description":"Define the strategy, direction and solution."},
    {"title":"Create","description":"Design, develop and produce the required work."},
    {"title":"Deliver","description":"Launch, measure and improve the final result."}]',
  '[{"title":"One team","description":"Design, technology, marketing and creative production under one team."},
    {"title":"Business first","description":"We focus on solving real business problems, not just creating attractive visuals."},
    {"title":"Built for people","description":"We create digital experiences that are simple, useful and easy to understand."},
    {"title":"Continuous improvement","description":"We refine our work based on feedback, performance and changing business needs."}]',
  '[{"title":"Digital marketing","href":"/services/digital-marketing"},
    {"title":"Web & software","href":"/services/web-design-development"},
    {"title":"Branding & design","href":"/services/graphic-designing"},
    {"title":"Photography & video","href":"/services/photography-videography"},
    {"title":"Multimedia","href":"/services/multimedia-production"}]',
  '[{"title":"Clarity","description":"We keep ideas and experiences simple and understandable."},
    {"title":"Quality","description":"We care about the details that make the final work better."},
    {"title":"Creativity","description":"We look for thoughtful and effective ways to solve problems."},
    {"title":"Partnership","description":"We work closely with clients throughout the process."}]',
  'Let''s work together',
  'Have a project, product or idea in mind? Let''s talk about how we can help.'
);

-- The hero cards' starting services (same as lib/seed.ts).
INSERT INTO hero_services (id, panel, title, description, illustration, link, sort_order) VALUES
  ('hero-it-website',          'it',        'Website Development',    'Fast, responsive websites that present your business clearly and win enquiries.',  'website',  '/services/web-design-development', 0),
  ('hero-it-web-apps',         'it',        'Web Applications',       'Browser-based portals and tools that simplify how your team and customers work.', 'webapp',   '/services/software-it-solutions',  1),
  ('hero-it-software',         'it',        'Custom Software',        'Software shaped around your processes, from internal systems to automation.',     'software', '/services/software-it-solutions',  2),
  ('hero-it-uiux',             'it',        'UI/UX Design',           'Interfaces planned around real users, so products feel simple and clear.',         'uiux',     '/services/web-design-development', 3),
  ('hero-it-cloud',            'it',        'Cloud & IT Support',     'Hosting, maintenance and support that keep your systems running smoothly.',        'cloud',    '/services/software-it-solutions',  4),
  ('hero-marketing-social',    'marketing', 'Social Media Marketing', 'Planned content and campaigns that grow an engaged audience on social.',           'social',   '/services/digital-marketing',      0),
  ('hero-marketing-seo',       'marketing', 'SEO Optimization',       'Search optimization that helps the right people find you on Google.',              'seo',      '/services/digital-marketing',      1),
  ('hero-marketing-ads',       'marketing', 'Google Ads',             'Targeted search and display campaigns focused on measurable results.',             'ads',      '/services/digital-marketing',      2),
  ('hero-marketing-content',   'marketing', 'Content Marketing',      'Articles, visuals and video that build trust in your brand.',                      'content',  '/services/digital-marketing',      3),
  ('hero-marketing-email',     'marketing', 'Email Marketing',        'Newsletters and automated journeys that keep customers coming back.',              'email',    '/services/digital-marketing',      4);

COMMIT;
