import { createPool, type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

import type {
  Database,
  GalleryItem,
  HeroService,
  MediaItem,
  Product,
  Project,
  Service,
  Settings,
  StudioItem,
  TopWork,
} from "./types";

/**
 * Loads and saves the whole `Database` from the MySQL tables in
 * `database/schema.sql`. `lib/db.ts` keeps all the business rules and calls
 * these two functions where it used to read and write `.data/db.json`.
 */

export type DbClient = PoolConnection;

const globalForMysql = globalThis as unknown as { markuiPool?: Pool };

/** One pool per process — reused across dev-server hot reloads. */
function pool(): Pool {
  if (!globalForMysql.markuiPool) {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env.local, e.g. " +
          "DATABASE_URL=mysql://root:<password>@localhost:3306/markui",
      );
    }
    globalForMysql.markuiPool = createPool({
      uri,
      connectionLimit: 5,
      charset: "utf8mb4",
      // DATETIME columns hold UTC; `date` stays a "yyyy-mm-dd" string, as
      // `Project.date` expects, and DECIMAL (cta_size) comes back as a number.
      timezone: "Z",
      dateStrings: ["DATE"],
      decimalNumbers: true,
      // BOOLEAN is TINYINT(1) in MySQL; hand it back as a real boolean.
      typeCast: (field, next) =>
        field.type === "TINY" && field.length === 1 ? field.string() === "1" : next(),
    });
    // Column defaults such as CURRENT_TIMESTAMP(3) should be UTC too.
    globalForMysql.markuiPool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'");
    });
  }
  return globalForMysql.markuiPool;
}

export async function withClient<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  const client = await pool().getConnection();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

/** NULL columns become missing optional fields, as they were in the JSON file. */
const opt = <T>(value: T | null): T | undefined => (value === null ? undefined : value);
const iso = (value: unknown) => (value as Date).toISOString();
const nullable = (value: string | undefined) => (value === undefined || value === "" ? null : value);
/** ISO strings become Dates, which the driver writes as UTC DATETIMEs. */
const ts = (value: string) => new Date(value);

function groupBy(rows: Row[], key: string): Map<string, Row[]> {
  const map = new Map<string, Row[]>();
  for (const row of rows) {
    const id = row[key] as string;
    const list = map.get(id);
    if (list) list.push(row);
    else map.set(id, [row]);
  }
  return map;
}

const toMedia = (row: Row): MediaItem => ({
  url: row.url as string,
  type: row.type as MediaItem["type"],
  name: opt(row.name as string | null),
});

const toGallery = (row: Row): GalleryItem => ({
  id: row.id as string,
  type: row.type as GalleryItem["type"],
  title: row.title as string,
  image: row.image as string,
  video: opt(row.video as string | null),
  active: row.active as boolean,
});

/**
 * A multi-row INSERT; skipped when there is nothing to write. Arrays go into
 * JSON columns, so they are sent as JSON text rather than expanded by the driver.
 */
async function insertRows(
  client: DbClient,
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  if (rows.length === 0) return;
  const params: unknown[] = [];
  const tuples = rows.map((row) => {
    const slots = row.map((value) => {
      params.push(Array.isArray(value) ? JSON.stringify(value) : value);
      return "?";
    });
    return `(${slots.join(", ")})`;
  });
  await client.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
    params,
  );
}

// ─── Load ────────────────────────────────────────────────────────────────────

/**
 * Reads every table in one snapshot. The result still goes through
 * `migrate` in `lib/db.ts`, which fills defaults and re-sanitises rich text.
 */
export async function loadDatabase(client: DbClient): Promise<Partial<Database>> {
  await client.query("START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY");
  try {
    const q = async (sql: string) => (await client.query<RowDataPacket[]>(sql))[0] as Row[];
    const [
      serviceRows,
      projectRows,
      projectServiceRows,
      projectGalleryRows,
      projectMediaRows,
      topWorkRows,
      topWorkMediaRows,
      productRows,
      productPreviewRows,
      productMediaRows,
      heroRows,
      studioRows,
      socialRows,
      settingsRows,
    ] = [
      await q("SELECT * FROM services"),
      await q("SELECT * FROM projects"),
      await q("SELECT * FROM project_services"),
      await q("SELECT * FROM project_gallery ORDER BY sort_order"),
      await q("SELECT * FROM project_media ORDER BY sort_order"),
      await q("SELECT * FROM top_work"),
      await q("SELECT * FROM top_work_media ORDER BY sort_order"),
      await q("SELECT * FROM products"),
      await q("SELECT * FROM product_preview ORDER BY sort_order"),
      await q("SELECT * FROM product_media ORDER BY sort_order"),
      await q("SELECT * FROM hero_services"),
      await q("SELECT * FROM studio_items"),
      await q("SELECT * FROM social_links ORDER BY sort_order"),
      await q("SELECT * FROM site_settings WHERE id = 1"),
    ];
    await client.query("COMMIT");

    const projectServices = groupBy(projectServiceRows, "project_id");
    const projectGallery = groupBy(projectGalleryRows, "project_id");
    const projectMedia = groupBy(projectMediaRows, "project_id");
    const topWorkMedia = groupBy(topWorkMediaRows, "top_work_id");
    const productPreview = groupBy(productPreviewRows, "product_id");
    const productMedia = groupBy(productMediaRows, "product_id");

    const services: Service[] = serviceRows.map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      name: r.name as string,
      shortDescription: r.short_description as string,
      fullDescription: r.full_description as string,
      image: r.image as string,
      icon: r.icon as string,
      features: r.features as string[],
      benefits: r.benefits as string[],
      tags: r.tags as string[],
      order: r.sort_order as number,
      active: r.active as boolean,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const projects: Project[] = projectRows.map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      description: r.description as string,
      fullDescription: opt(r.full_description as string | null),
      outcome: opt(r.outcome as string | null),
      client: opt(r.client as string | null),
      category: r.category as Project["category"],
      image: r.image as string,
      coverType: r.cover_type as Project["coverType"],
      coverVideo: opt(r.cover_video as string | null),
      link: opt(r.link as string | null),
      portfolioUrl: opt(r.portfolio_url as string | null),
      deliverables: r.deliverables as string[],
      serviceIds: (projectServices.get(r.id as string) ?? []).map((s) => s.service_id as string),
      featured: r.featured as boolean,
      active: r.active as boolean,
      gallery: (projectGallery.get(r.id as string) ?? []).map(toGallery),
      date: opt(r.project_date as string | null),
      industry: opt(r.industry as string | null),
      tag: opt(r.tag as string | null),
      size: r.size as Project["size"],
      media: (projectMedia.get(r.id as string) ?? []).map(toMedia),
      order: r.sort_order as number,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const topWork: TopWork[] = topWorkRows.map((r) => ({
      id: r.id as string,
      serviceId: r.service_id as string,
      projectId: opt(r.project_id as string | null),
      title: r.title as string,
      description: r.description as string,
      mediaType: opt(r.media_type as TopWork["mediaType"] | null),
      image: r.image as string,
      video: opt(r.video as string | null),
      category: opt(r.category as string | null),
      media: (topWorkMedia.get(r.id as string) ?? []).map(toMedia),
      link: opt(r.link as string | null),
      order: r.sort_order as number,
      active: r.active as boolean,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const products: Product[] = productRows.map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      name: r.name as string,
      shortDescription: r.short_description as string,
      fullDescription: r.full_description as string,
      image: r.image as string,
      logo: opt(r.logo as string | null),
      icon: r.icon as string,
      category: opt(r.category as string | null),
      status: r.status as Product["status"],
      features: r.features as string[],
      technologies: r.technologies as string[],
      preview: (productPreview.get(r.id as string) ?? []).map(toGallery),
      price: opt(r.price as string | null),
      link: opt(r.link as string | null),
      ctaLabel: opt(r.cta_label as string | null),
      media: (productMedia.get(r.id as string) ?? []).map(toMedia),
      order: r.sort_order as number,
      active: r.active as boolean,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const heroServices: HeroService[] = heroRows.map((r) => ({
      id: r.id as string,
      panel: r.panel as HeroService["panel"],
      title: r.title as string,
      description: r.description as string,
      illustration: r.illustration as HeroService["illustration"],
      image: opt(r.image as string | null),
      link: opt(r.link as string | null),
      order: r.sort_order as number,
      active: r.active as boolean,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const studio: StudioItem[] = studioRows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string,
      mediaType: r.media_type as StudioItem["mediaType"],
      image: r.image as string,
      video: opt(r.video as string | null),
      link: opt(r.link as string | null),
      order: r.sort_order as number,
      active: r.active as boolean,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
    }));

    const s = settingsRows[0];
    const settings: Settings | undefined = s && {
      portfolioUrl: s.portfolio_url as string,
      home: {
        heading: s.hero_heading as Settings["home"]["heading"],
        description: s.hero_description as Settings["home"]["description"],
        ctaText: s.cta_text as string,
        ctaLink: s.cta_link as string,
        ctaSize: opt(s.cta_size as number | null),
        ctaWeight: opt(s.cta_weight as number | null),
        ctaColor: opt(s.cta_color as string | null),
        itTitle: s.it_title as string,
        itDescription: s.it_description as string,
        itLink: s.it_link as string,
        marketingTitle: s.marketing_title as string,
        marketingDescription: s.marketing_description as string,
        marketingLink: s.marketing_link as string,
      },
      about: {
        heroHeading: s.about_hero_heading as string,
        introduction: s.about_introduction as string,
        whoWeAre: s.about_who_we_are as string,
        approach: s.about_approach as Settings["about"]["approach"],
        reasons: s.about_reasons as Settings["about"]["reasons"],
        expertise: s.about_expertise as Settings["about"]["expertise"],
        values: s.about_values as Settings["about"]["values"],
        ctaHeading: s.about_cta_heading as string,
        ctaText: s.about_cta_text as string,
      },
      socialLinks: socialRows.map((r) => ({ label: r.label as string, url: r.url as string })),
      updatedAt: iso(s.updated_at),
    };

    return { projects, services, topWork, products, studio, heroServices, settings };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

// ─── Save ────────────────────────────────────────────────────────────────────

/**
 * Replaces the stored data with `db` in one transaction, so readers see either
 * the old state or the new one, never a mix. The data set is small (tens of
 * rows), which keeps a full rewrite cheap and the logic in `lib/db.ts` intact.
 */
export async function saveDatabase(client: DbClient, db: Database): Promise<void> {
  await client.query("START TRANSACTION");
  try {
    // Children go with their parents via ON DELETE CASCADE.
    for (const table of ["top_work", "projects", "services", "products", "hero_services",
      "studio_items", "social_links", "site_settings"]) {
      await client.query(`DELETE FROM ${table}`);
    }

    await insertRows(
      client,
      "services",
      ["id", "slug", "name", "short_description", "full_description", "image", "icon",
        "features", "benefits", "tags", "sort_order", "active", "created_at", "updated_at"],
      db.services.map((s) => [
        s.id, s.slug, s.name, s.shortDescription, s.fullDescription, s.image, s.icon,
        s.features, s.benefits, s.tags, s.order, s.active, ts(s.createdAt), ts(s.updatedAt),
      ]),
    );

    await insertRows(
      client,
      "projects",
      ["id", "slug", "title", "description", "full_description", "outcome", "client", "category",
        "image", "cover_type", "cover_video", "link", "portfolio_url", "deliverables", "featured",
        "active", "project_date", "industry", "tag", "size", "sort_order", "created_at", "updated_at"],
      db.projects.map((p) => [
        p.id, p.slug, p.title, p.description, p.fullDescription ?? null, p.outcome ?? null,
        p.client ?? null, p.category, p.image, p.coverType ?? "image", p.coverVideo ?? null,
        p.link ?? null, p.portfolioUrl ?? null, p.deliverables ?? [], p.featured ?? false,
        p.active ?? true, nullable(p.date), p.industry ?? null, p.tag ?? null, p.size,
        p.order, ts(p.createdAt), ts(p.updatedAt),
      ]),
    );

    // A deleted service can linger in `serviceIds`; drop it, as the FK cascade would.
    const serviceIds = new Set(db.services.map((s) => s.id));
    await insertRows(
      client,
      "project_services",
      ["project_id", "service_id"],
      db.projects.flatMap((p) =>
        [...new Set(p.serviceIds ?? [])].filter((id) => serviceIds.has(id)).map((id) => [p.id, id]),
      ),
    );

    await insertRows(
      client,
      "project_gallery",
      ["id", "project_id", "type", "title", "image", "video", "active", "sort_order"],
      db.projects.flatMap((p) =>
        (p.gallery ?? []).map((g, i) => [g.id, p.id, g.type, g.title, g.image, g.video ?? null, g.active, i]),
      ),
    );

    await insertRows(
      client,
      "project_media",
      ["project_id", "url", "type", "name", "sort_order"],
      db.projects.flatMap((p) => p.media.map((m, i) => [p.id, m.url, m.type, m.name ?? null, i])),
    );

    await insertRows(
      client,
      "top_work",
      ["id", "service_id", "project_id", "title", "description", "media_type", "image", "video",
        "category", "link", "sort_order", "active", "created_at", "updated_at"],
      db.topWork.map((w) => [
        w.id, w.serviceId, w.projectId ?? null, w.title, w.description, w.mediaType ?? null,
        w.image, w.video ?? null, w.category ?? null, w.link ?? null, w.order, w.active,
        ts(w.createdAt), ts(w.updatedAt),
      ]),
    );

    await insertRows(
      client,
      "top_work_media",
      ["top_work_id", "url", "type", "name", "sort_order"],
      db.topWork.flatMap((w) => w.media.map((m, i) => [w.id, m.url, m.type, m.name ?? null, i])),
    );

    await insertRows(
      client,
      "products",
      ["id", "slug", "name", "short_description", "full_description", "image", "logo", "icon",
        "category", "status", "features", "technologies", "price", "link", "cta_label",
        "sort_order", "active", "created_at", "updated_at"],
      db.products.map((p) => [
        p.id, p.slug, p.name, p.shortDescription, p.fullDescription, p.image, p.logo ?? null,
        p.icon, p.category ?? null, p.status ?? "available", p.features, p.technologies ?? [],
        p.price ?? null, p.link ?? null, p.ctaLabel ?? null, p.order, p.active,
        ts(p.createdAt), ts(p.updatedAt),
      ]),
    );

    await insertRows(
      client,
      "product_preview",
      ["id", "product_id", "type", "title", "image", "video", "active", "sort_order"],
      db.products.flatMap((p) =>
        (p.preview ?? []).map((g, i) => [g.id, p.id, g.type, g.title, g.image, g.video ?? null, g.active, i]),
      ),
    );

    await insertRows(
      client,
      "product_media",
      ["product_id", "url", "type", "name", "sort_order"],
      db.products.flatMap((p) => p.media.map((m, i) => [p.id, m.url, m.type, m.name ?? null, i])),
    );

    await insertRows(
      client,
      "hero_services",
      ["id", "panel", "title", "description", "illustration", "image", "link",
        "sort_order", "active", "created_at", "updated_at"],
      db.heroServices.map((h) => [
        h.id, h.panel, h.title, h.description, h.illustration, h.image ?? null, h.link ?? null,
        h.order, h.active, ts(h.createdAt), ts(h.updatedAt),
      ]),
    );

    await insertRows(
      client,
      "studio_items",
      ["id", "title", "description", "media_type", "image", "video", "link",
        "sort_order", "active", "created_at", "updated_at"],
      db.studio.map((s) => [
        s.id, s.title, s.description, s.mediaType, s.image, s.video ?? null, s.link ?? null,
        s.order, s.active, ts(s.createdAt), ts(s.updatedAt),
      ]),
    );

    await insertRows(
      client,
      "social_links",
      ["label", "url", "sort_order"],
      db.settings.socialLinks.map((l, i) => [l.label, l.url, i]),
    );

    const { home, about } = db.settings;
    await insertRows(
      client,
      "site_settings",
      ["id", "portfolio_url", "hero_heading", "hero_description", "cta_text", "cta_link",
        "cta_size", "cta_weight", "cta_color", "it_title", "it_description", "it_link",
        "marketing_title", "marketing_description", "marketing_link", "about_hero_heading",
        "about_introduction", "about_who_we_are", "about_approach", "about_reasons",
        "about_expertise", "about_values", "about_cta_heading", "about_cta_text", "updated_at"],
      [[
        1, db.settings.portfolioUrl, JSON.stringify(home.heading), JSON.stringify(home.description),
        home.ctaText, home.ctaLink, home.ctaSize ?? null, home.ctaWeight ?? null,
        home.ctaColor ?? null, home.itTitle, home.itDescription, home.itLink,
        home.marketingTitle, home.marketingDescription, home.marketingLink,
        about.heroHeading, about.introduction, about.whoWeAre,
        JSON.stringify(about.approach), JSON.stringify(about.reasons),
        JSON.stringify(about.expertise), JSON.stringify(about.values),
        about.ctaHeading, about.ctaText, ts(db.settings.updatedAt),
      ]],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

// ─── Admin login ─────────────────────────────────────────────────────────────

export interface StoredAdminAccount {
  username: string;
  passwordHash: string;
  updatedAt: Date;
}

/** The login saved from Admin → Account, or `null` while `.env.local` applies. */
export async function loadAdminAccount(client: DbClient): Promise<StoredAdminAccount | null> {
  const [rows] = await client.query<RowDataPacket[]>(
    "SELECT username, password_hash, updated_at FROM admin_account WHERE id = 1",
  );
  const row = rows[0];
  return row
    ? {
        username: row.username as string,
        passwordHash: row.password_hash as string,
        updatedAt: row.updated_at as Date,
      }
    : null;
}

export async function saveAdminAccount(
  client: DbClient,
  username: string,
  passwordHash: string,
): Promise<void> {
  await client.query(
    "INSERT INTO admin_account (id, username, password_hash, updated_at) VALUES (1, ?, ?, ?) AS new " +
      "ON DUPLICATE KEY UPDATE username = new.username, " +
      "password_hash = new.password_hash, updated_at = new.updated_at",
    [username, passwordHash, new Date()],
  );
}

// ─── First run ───────────────────────────────────────────────────────────────

export async function isInitialized(client: DbClient): Promise<boolean> {
  const [rows] = await client.query<RowDataPacket[]>(
    "SELECT 1 FROM app_meta WHERE meta_key = 'initialized'",
  );
  return rows.length > 0;
}

export async function markInitialized(client: DbClient, source: string): Promise<void> {
  await client.query(
    "INSERT IGNORE INTO app_meta (meta_key, meta_value) VALUES ('initialized', ?)",
    [`${source} @ ${new Date().toISOString()}`],
  );
}
