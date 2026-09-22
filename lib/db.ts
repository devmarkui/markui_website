import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  type DbClient,
  isInitialized,
  loadDatabase,
  markInitialized,
  saveDatabase,
  withClient,
} from "./mysql-store";
import {
  BODY_LIMITS,
  HEADING_LIMITS,
  richFromLines,
  sanitizeColor,
  sanitizeRichDoc,
  sanitizeWeight,
} from "./rich-text";
import { slugify } from "./slug";
import {
  SEED_HERO_SERVICES,
  SEED_PROJECTS,
  SEED_SERVICES,
  SEED_TOP_WORK_PER_SERVICE,
} from "./seed";
import {
  CTA_SIZE_RANGE,
  DB_VERSION,
  DEFAULT_ABOUT,
  DEFAULT_HOME,
  DEFAULT_SETTINGS,
  type Database,
  type HeroPanel,
  type HomeContent,
  type HeroService,
  type Product,
  type Project,
  type ResolvedTopWork,
  type Service,
  type Settings,
  type StudioItem,
  type TopWork,
} from "./types";

/**
 * The site's data store, backed by MySQL (`database/schema.sql`,
 * connected through `DATABASE_URL`).
 *
 * Content lives in the database; uploaded media stays on disk in
 * `.data/uploads`, outside `app/` and `public/` so the dev server does not
 * recompile on every upload. The first run fills the tables from the old
 * `.data/db.json` when it exists, otherwise from the seed.
 */

export const DATA_DIR = path.join(process.cwd(), ".data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
/** The pre-MySQL store; only read once, to import it. */
const LEGACY_DB_FILE = path.join(DATA_DIR, "db.json");

/**
 * Serialises reads and writes within this process so two concurrent admin
 * actions can never interleave a read-modify-write and lose one of the edits.
 */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  // Keep the chain alive even if this task rejects.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Saves in one transaction, so a failure can never leave a half-written db. */
async function writeDb(db: Database) {
  await withClient((client) => saveDatabase(client, db));
}

/** Set once this process has confirmed the tables are filled. */
let initialized = false;

async function readDb(): Promise<Database> {
  return withClient(async (client) => {
    if (!initialized) {
      if (!(await isInitialized(client))) await importInitialData(client);
      initialized = true;
    }
    // `migrate` fills defaults and re-sanitises rich text on every read.
    return migrate({ ...(await loadDatabase(client)), version: DB_VERSION });
  });
}

/**
 * First run against an empty database: import `.data/db.json` (brought up to
 * the current shape by `migrate`), or seed when there is no such file.
 */
async function importInitialData(client: DbClient) {
  let db: Database;
  let source: string;
  try {
    const raw = await fs.readFile(LEGACY_DB_FILE, "utf8");
    db = migrate(
      JSON.parse(raw) as Partial<Database> & {
        // v1 kept services in `products`; see `migrate`.
        products?: unknown[];
      },
    );
    source = "imported .data/db.json";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    db = await buildSeedDatabase();
    source = "seeded";
  }
  await saveDatabase(client, db);
  await markInitialized(client, source);
}

// ─── Migration ───────────────────────────────────────────────────────────────

/** The v1 product shape, which actually held the agency's services. */
interface LegacyProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  icon?: string;
  price?: string;
  link?: string;
  items: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Brings an older file up to the current shape.
 *
 * v1 → v2: Products and Services were one collection, stored under `products`,
 * and every row in it was in fact a service. Those rows move to `services`,
 * keeping any edits the admin had already made, and gaining the new long-form
 * fields from the seed where the slug still matches. `products` starts empty —
 * real products are added through the dashboard.
 */
function migrate(parsed: Partial<Database> & { products?: unknown[] }): Database {
  const version = parsed.version ?? 1;
  const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

  if (version >= DB_VERSION) {
    return {
      version: DB_VERSION,
      projects,
      services: Array.isArray(parsed.services) ? parsed.services : [],
      topWork: Array.isArray(parsed.topWork) ? parsed.topWork : [],
      products: Array.isArray(parsed.products)
        ? (parsed.products as Product[])
        : [],
      studio: Array.isArray(parsed.studio) ? parsed.studio : [],
      heroServices: Array.isArray(parsed.heroServices)
        ? parsed.heroServices
        : seedHeroServices(),
      settings: normalizeSettings(parsed.settings),
    };
  }

  const legacy = (parsed.products ?? []) as LegacyProduct[];
  const now = new Date().toISOString();

  const services: Service[] = legacy.map((row, index) => {
    const seed =
      SEED_SERVICES.find((s) => s.slug === row.slug) ??
      SEED_SERVICES.find((s) => s.name === row.name);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      // Admin edits win; seed only fills the fields v1 did not have.
      shortDescription: row.description,
      fullDescription: seed?.fullDescription ?? row.description,
      image: row.image ?? "",
      icon: row.icon ?? seed?.icon ?? "◆",
      features: row.items ?? [],
      benefits: seed?.benefits ?? [],
      tags: seed?.tags ?? [],
      order: row.order ?? index,
      active: true,
      createdAt: row.createdAt ?? now,
      updatedAt: row.updatedAt ?? now,
    };
  });

  return {
    version: DB_VERSION,
    projects,
    services,
    topWork: buildSeedTopWork(services, projects),
    products: [],
    studio: [],
    heroServices: seedHeroServices(),
    settings: { ...DEFAULT_SETTINGS, updatedAt: now },
  };
}

/** Older databases have no About or Home content; merge each nested field safely. */
function normalizeSettings(settings: Partial<Settings> | undefined): Settings {
  const about = settings?.about;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    home: normalizeHome(settings?.home),
    socialLinks: Array.isArray(settings?.socialLinks) ? settings.socialLinks : [],
    about: {
      ...DEFAULT_ABOUT,
      ...(about ?? {}),
      approach: Array.isArray(about?.approach) ? about.approach : DEFAULT_ABOUT.approach,
      reasons: Array.isArray(about?.reasons) ? about.reasons : DEFAULT_ABOUT.reasons,
      expertise: Array.isArray(about?.expertise) ? about.expertise : DEFAULT_ABOUT.expertise,
      values: Array.isArray(about?.values) ? about.values : DEFAULT_ABOUT.values,
    },
  };
}

/** The plain-text hero fields stored before the heading became rich text. */
interface LegacyHome {
  heroHeading?: string;
  heroSubheading?: string;
  heroDescription?: string;
}

/**
 * Brings stored Home content up to date and re-validates it.
 *
 * Older records kept the hero heading as two strings (main + secondary). They
 * become one rich-text heading — main heading lines first, then the secondary
 * lines in bold, which is how the site showed them — so nothing is lost.
 * Rich text is sanitised on every read, not just on save.
 */
function normalizeHome(raw: unknown): HomeContent {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Partial<HomeContent> &
    LegacyHome;
  const { heroHeading, heroSubheading, heroDescription, ...rest } = stored;

  const lines = (value: string | undefined) =>
    (value ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

  const legacyHeading =
    heroHeading !== undefined || heroSubheading !== undefined
      ? richFromLines([
          ...lines(heroHeading).map((text) => ({ text })),
          ...lines(heroSubheading).map((text) => ({ text, marks: { weight: 800 } })),
        ])
      : null;
  const legacyDescription =
    heroDescription !== undefined
      ? richFromLines(lines(heroDescription).map((text) => ({ text })))
      : null;

  const ctaSize =
    typeof rest.ctaSize === "number" && Number.isFinite(rest.ctaSize)
      ? Math.min(CTA_SIZE_RANGE.max, Math.max(CTA_SIZE_RANGE.min, rest.ctaSize))
      : undefined;

  return {
    ...DEFAULT_HOME,
    ...rest,
    heading:
      sanitizeRichDoc(rest.heading, HEADING_LIMITS) ??
      (legacyHeading && sanitizeRichDoc(legacyHeading, HEADING_LIMITS)) ??
      DEFAULT_HOME.heading,
    description:
      sanitizeRichDoc(rest.description, BODY_LIMITS) ??
      (legacyDescription && sanitizeRichDoc(legacyDescription, BODY_LIMITS)) ??
      DEFAULT_HOME.description,
    ctaSize,
    ctaWeight: sanitizeWeight(rest.ctaWeight),
    ctaColor: sanitizeColor(rest.ctaColor),
  };
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/** A fresh copy, so edits never touch the module-level seed. */
function seedHeroServices() {
  return SEED_HERO_SERVICES.map((item) => ({ ...item }));
}

/** True when a `/public`-relative path actually exists on disk. */
async function publicFileExists(publicPath: string) {
  if (!publicPath.startsWith("/")) return false;
  try {
    await fs.access(path.join(process.cwd(), "public", publicPath.slice(1)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Links each service to a few existing projects in its matching category, so
 * Top Work is populated out of the box without duplicating any content. Fully
 * editable from the dashboard afterwards.
 */
function buildSeedTopWork(services: Service[], projects: Project[]): TopWork[] {
  const now = new Date().toISOString();
  const items: TopWork[] = [];

  for (const service of services) {
    const seed = SEED_SERVICES.find((s) => s.slug === service.slug);
    if (!seed?.topWorkFrom) continue;

    const matching = projects
      .filter((p) => p.category === seed.topWorkFrom)
      .slice(0, SEED_TOP_WORK_PER_SERVICE);

    matching.forEach((project, index) => {
      items.push({
        id: randomUUID(),
        serviceId: service.id,
        projectId: project.id,
        // Empty: the linked project supplies title, copy and image.
        title: "",
        description: "",
        image: "",
        media: [],
        order: index,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  return items;
}

async function buildSeedDatabase(): Promise<Database> {
  const now = new Date().toISOString();
  const usedSlugs = new Set<string>();

  const projects: Project[] = await Promise.all(
    SEED_PROJECTS.map(async (seed, index) => {
      // Half of the original demo thumbnails were never added to `public/`.
      // Seeding them would make `next/image` 404 on every page load, so an
      // absent file becomes an empty image and the card draws a placeholder.
      const hasImage = await publicFileExists(seed.image);
      return {
        id: randomUUID(),
        slug: uniqueSlug(seed.title, usedSlugs),
        title: seed.title,
        description: seed.description,
        category: seed.category,
        image: hasImage ? seed.image : "",
        industry: seed.industry,
        tag: seed.tag,
        size: seed.size,
        media: [],
        order: index,
        createdAt: now,
        updatedAt: now,
      } satisfies Project;
    }),
  );

  const services: Service[] = SEED_SERVICES.map((seed, index) => ({
    id: randomUUID(),
    slug: seed.slug,
    name: seed.name,
    shortDescription: seed.shortDescription,
    fullDescription: seed.fullDescription,
    image: "",
    icon: seed.icon,
    features: seed.features,
    benefits: seed.benefits,
    tags: seed.tags,
    order: index,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    version: DB_VERSION,
    projects,
    services,
    topWork: buildSeedTopWork(services, projects),
    products: [],
    studio: [],
    heroServices: seedHeroServices(),
    settings: { ...DEFAULT_SETTINGS, updatedAt: now },
  };
}

// ─── Slugs ───────────────────────────────────────────────────────────────────

export { slugify };

function uniqueSlug(input: string, taken: Set<string>) {
  const base = slugify(input);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

const byOrder = <T extends { order: number; createdAt: string }>(a: T, b: T) =>
  a.order - b.order || a.createdAt.localeCompare(b.createdAt);

// ─── Projects ────────────────────────────────────────────────────────────────

/** Active projects in display order; the admin passes `includeInactive`. */
export async function getProjects({
  includeInactive = false,
}: { includeInactive?: boolean } = {}): Promise<Project[]> {
  const db = await withLock(readDb);
  return db.projects
    .filter((p) => includeInactive || p.active !== false)
    .sort(byOrder);
}

export async function reorderProjects(orderedIds: string[]): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const project = db.projects.find((p) => p.id === id);
      if (project && project.order !== index) {
        project.order = index;
        project.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await withLock(readDb);
  return db.projects.find((p) => p.id === id) ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const db = await withLock(readDb);
  return db.projects.find((p) => p.slug === slug) ?? null;
}

export type ProjectInput = Omit<
  Project,
  "id" | "slug" | "order" | "createdAt" | "updatedAt"
>;

export async function createProject(input: ProjectInput): Promise<Project> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const project: Project = {
      ...input,
      id: randomUUID(),
      slug: uniqueSlug(input.title, new Set(db.projects.map((p) => p.slug))),
      order: db.projects.reduce((max, p) => Math.max(max, p.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(project);
    await writeDb(db);
    return project;
  });
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Promise<Project | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = db.projects[index];
    const next: Project = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    // Keep the slug in step with a renamed project, without colliding.
    if (input.title && input.title !== current.title) {
      const taken = new Set(
        db.projects.filter((p) => p.id !== id).map((p) => p.slug),
      );
      next.slug = uniqueSlug(input.title, taken);
    }

    db.projects[index] = next;
    await writeDb(db);
    return next;
  });
}

/**
 * Returns the deleted project, plus any Top Work entries that pointed at it
 * (they would otherwise render as blanks), so the caller can clean up files.
 */
export async function deleteProject(
  id: string,
): Promise<{ project: Project; topWork: TopWork[] } | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const [project] = db.projects.splice(index, 1);
    const topWork = db.topWork.filter((w) => w.projectId === id);
    db.topWork = db.topWork.filter((w) => w.projectId !== id);

    await writeDb(db);
    return { project, topWork };
  });
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices({
  includeInactive = false,
}: { includeInactive?: boolean } = {}): Promise<Service[]> {
  const db = await withLock(readDb);
  return db.services
    .filter((s) => includeInactive || s.active)
    .sort(byOrder);
}

export async function getService(id: string): Promise<Service | null> {
  const db = await withLock(readDb);
  return db.services.find((s) => s.id === id) ?? null;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const db = await withLock(readDb);
  return db.services.find((s) => s.slug === slug) ?? null;
}

export type ServiceInput = Omit<
  Service,
  "id" | "slug" | "order" | "createdAt" | "updatedAt"
> & { slug?: string };

export async function createService(input: ServiceInput): Promise<Service> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const taken = new Set(db.services.map((s) => s.slug));
    const service: Service = {
      ...input,
      id: randomUUID(),
      slug: uniqueSlug(input.slug?.trim() || input.name, taken),
      order: db.services.reduce((max, s) => Math.max(max, s.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.services.push(service);
    await writeDb(db);
    return service;
  });
}

export async function updateService(
  id: string,
  input: Partial<ServiceInput>,
): Promise<Service | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.services.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const current = db.services[index];
    const next: Service = {
      ...current,
      ...input,
      slug: current.slug,
      updatedAt: new Date().toISOString(),
    };

    // The slug is the public URL, so only change it when asked explicitly.
    const requested = input.slug?.trim();
    if (requested && requested !== current.slug) {
      const taken = new Set(
        db.services.filter((s) => s.id !== id).map((s) => s.slug),
      );
      next.slug = uniqueSlug(requested, taken);
    }

    db.services[index] = next;
    await writeDb(db);
    return next;
  });
}

/**
 * Deleting a service also removes the Top Work that belonged to it. Both are
 * returned so the caller can unlink the files they owned — otherwise the
 * cascaded Top Work would leave orphaned uploads behind.
 */
export async function deleteService(
  id: string,
): Promise<{ service: Service; topWork: TopWork[] } | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.services.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const [service] = db.services.splice(index, 1);
    const topWork = db.topWork.filter((w) => w.serviceId === id);
    db.topWork = db.topWork.filter((w) => w.serviceId !== id);

    await writeDb(db);
    return { service, topWork };
  });
}

export async function reorderServices(orderedIds: string[]): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const service = db.services.find((s) => s.id === id);
      if (service && service.order !== index) {
        service.order = index;
        service.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

// ─── Top Work ────────────────────────────────────────────────────────────────

export async function getTopWork(serviceId?: string): Promise<TopWork[]> {
  const db = await withLock(readDb);
  return db.topWork
    .filter((w) => !serviceId || w.serviceId === serviceId)
    .sort(byOrder);
}

export async function getTopWorkItem(id: string): Promise<TopWork | null> {
  const db = await withLock(readDb);
  return db.topWork.find((w) => w.id === id) ?? null;
}

export type TopWorkInput = Omit<
  TopWork,
  "id" | "order" | "createdAt" | "updatedAt"
>;

export async function createTopWork(input: TopWorkInput): Promise<TopWork> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const siblings = db.topWork.filter((w) => w.serviceId === input.serviceId);
    const item: TopWork = {
      ...input,
      id: randomUUID(),
      order: siblings.reduce((max, w) => Math.max(max, w.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.topWork.push(item);
    await writeDb(db);
    return item;
  });
}

export async function updateTopWork(
  id: string,
  input: Partial<TopWorkInput>,
): Promise<TopWork | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.topWork.findIndex((w) => w.id === id);
    if (index === -1) return null;
    db.topWork[index] = {
      ...db.topWork[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.topWork[index];
  });
}

export async function reorderTopWork(
  serviceId: string,
  orderedIds: string[],
): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const item = db.topWork.find(
        (w) => w.id === id && w.serviceId === serviceId,
      );
      if (item && item.order !== index) {
        item.order = index;
        item.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

export async function deleteTopWork(id: string): Promise<TopWork | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.topWork.findIndex((w) => w.id === id);
    if (index === -1) return null;
    const [removed] = db.topWork.splice(index, 1);
    await writeDb(db);
    return removed;
  });
}

/**
 * A service's Top Work with linked projects resolved, ready to render.
 * Items whose linked project has gone are dropped rather than shown blank.
 */
export async function getResolvedTopWork(
  serviceId: string,
): Promise<ResolvedTopWork[]> {
  const db = await withLock(readDb);
  return resolveTopWork(db, serviceId);
}

/**
 * Every active service paired with its own resolved Top Work, in display
 * order — one read for the whole /services page.
 */
export async function getServicesWithTopWork(): Promise<
  { service: Service; topWork: ResolvedTopWork[] }[]
> {
  const db = await withLock(readDb);
  return db.services
    .filter((s) => s.active)
    .sort(byOrder)
    .map((service) => ({ service, topWork: resolveTopWork(db, service.id) }));
}

function resolveTopWork(db: Database, serviceId: string): ResolvedTopWork[] {
  const projects = new Map(db.projects.map((p) => [p.id, p]));

  return db.topWork
    .filter((w) => w.serviceId === serviceId && w.active)
    .sort(byOrder)
    .flatMap((work) => {
      const project = work.projectId ? projects.get(work.projectId) : undefined;
      // A deleted or hidden project takes its Top Work with it.
      if (work.projectId && (!project || project.active === false)) return [];

      // A bespoke value always wins; otherwise fall back to the project.
      const image = work.image || project?.image || "";
      const media = work.media.length ? work.media : (project?.media ?? []);
      const video =
        work.video || media.find((m) => m.type === "video")?.url || "";
      const wanted = work.mediaType ?? (image ? "image" : "video");
      // A video item with nothing to play degrades to its still image.
      const mediaType = wanted === "video" && video ? "video" : "image";

      const resolved: ResolvedTopWork = {
        id: work.id,
        title: work.title || project?.title || "Untitled",
        description: work.description || project?.description || "",
        mediaType,
        image,
        video: mediaType === "video" ? video : undefined,
        media,
        link: work.link || project?.link,
        category: work.category || project?.category,
        fromProject: Boolean(project),
      };
      return [resolved];
    });
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts({
  includeInactive = false,
}: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const db = await withLock(readDb);
  return db.products
    .filter((p) => includeInactive || p.active)
    .sort(byOrder);
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = await withLock(readDb);
  return db.products.find((p) => p.id === id) ?? null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = await withLock(readDb);
  return db.products.find((p) => p.slug === slug) ?? null;
}

export type ProductInput = Omit<
  Product,
  "id" | "slug" | "order" | "createdAt" | "updatedAt"
>;

export async function createProduct(input: ProductInput): Promise<Product> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      id: randomUUID(),
      slug: uniqueSlug(input.name, new Set(db.products.map((p) => p.slug))),
      order: db.products.reduce((max, p) => Math.max(max, p.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.products.push(product);
    await writeDb(db);
    return product;
  });
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = db.products[index];
    const next: Product = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (input.name && input.name !== current.name) {
      const taken = new Set(
        db.products.filter((p) => p.id !== id).map((p) => p.slug),
      );
      next.slug = uniqueSlug(input.name, taken);
    }

    db.products[index] = next;
    await writeDb(db);
    return next;
  });
}

export async function reorderProducts(orderedIds: string[]): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const product = db.products.find((p) => p.id === id);
      if (product && product.order !== index) {
        product.order = index;
        product.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

export async function deleteProduct(id: string): Promise<Product | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const [removed] = db.products.splice(index, 1);
    await writeDb(db);
    return removed;
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const db = await withLock(readDb);
  return db.settings;
}

export async function updateSettings(
  input: Partial<Omit<Settings, "updatedAt">>,
): Promise<Settings> {
  return withLock(async () => {
    const db = await readDb();
    db.settings = {
      ...db.settings,
      ...input,
      about: input.about
        ? { ...db.settings.about, ...input.about }
        : db.settings.about,
      home: input.home
        ? { ...db.settings.home, ...input.home }
        : db.settings.home,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.settings;
  });
}

// ─── Latest From Our Studio ──────────────────────────────────────────────────

/** Active items in display order; the admin passes `includeInactive`. */
export async function getStudioItems({
  includeInactive = false,
}: { includeInactive?: boolean } = {}): Promise<StudioItem[]> {
  const db = await withLock(readDb);
  return db.studio
    .filter((item) => includeInactive || item.active)
    .sort(byOrder);
}

export async function getStudioItem(id: string): Promise<StudioItem | null> {
  const db = await withLock(readDb);
  return db.studio.find((item) => item.id === id) ?? null;
}

export type StudioInput = Omit<
  StudioItem,
  "id" | "order" | "createdAt" | "updatedAt"
>;

export async function createStudioItem(input: StudioInput): Promise<StudioItem> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const item: StudioItem = {
      ...input,
      id: randomUUID(),
      order: db.studio.reduce((max, s) => Math.max(max, s.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.studio.push(item);
    await writeDb(db);
    return item;
  });
}

export async function updateStudioItem(
  id: string,
  input: Partial<StudioInput>,
): Promise<StudioItem | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.studio.findIndex((item) => item.id === id);
    if (index === -1) return null;
    db.studio[index] = {
      ...db.studio[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.studio[index];
  });
}

export async function reorderStudioItems(orderedIds: string[]): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const item = db.studio.find((s) => s.id === id);
      if (item && item.order !== index) {
        item.order = index;
        item.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

export async function deleteStudioItem(id: string): Promise<StudioItem | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.studio.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const [removed] = db.studio.splice(index, 1);
    await writeDb(db);
    return removed;
  });
}

// ─── Hero service cards ──────────────────────────────────────────────────────

/** One panel's services (or both), in display order. */
export async function getHeroServices({
  panel,
  includeInactive = false,
}: { panel?: HeroPanel; includeInactive?: boolean } = {}): Promise<HeroService[]> {
  const db = await withLock(readDb);
  return db.heroServices
    .filter((s) => !panel || s.panel === panel)
    .filter((s) => includeInactive || s.active)
    .sort(byOrder);
}

export async function getHeroService(id: string): Promise<HeroService | null> {
  const db = await withLock(readDb);
  return db.heroServices.find((s) => s.id === id) ?? null;
}

export type HeroServiceInput = Omit<
  HeroService,
  "id" | "order" | "createdAt" | "updatedAt"
>;

export async function createHeroService(
  input: HeroServiceInput,
): Promise<HeroService> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    const siblings = db.heroServices.filter((s) => s.panel === input.panel);
    const item: HeroService = {
      ...input,
      id: randomUUID(),
      order: siblings.reduce((max, s) => Math.max(max, s.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.heroServices.push(item);
    await writeDb(db);
    return item;
  });
}

export async function updateHeroService(
  id: string,
  input: Partial<HeroServiceInput>,
): Promise<HeroService | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.heroServices.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const current = db.heroServices[index];
    const next: HeroService = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    // Moving to the other card puts it at the end of that card's rotation.
    if (input.panel && input.panel !== current.panel) {
      next.order =
        db.heroServices
          .filter((s) => s.panel === input.panel)
          .reduce((max, s) => Math.max(max, s.order), -1) + 1;
    }
    db.heroServices[index] = next;
    await writeDb(db);
    return next;
  });
}

export async function reorderHeroServices(
  panel: HeroPanel,
  orderedIds: string[],
): Promise<void> {
  return withLock(async () => {
    const db = await readDb();
    const now = new Date().toISOString();
    orderedIds.forEach((id, index) => {
      const item = db.heroServices.find((s) => s.id === id && s.panel === panel);
      if (item && item.order !== index) {
        item.order = index;
        item.updatedAt = now;
      }
    });
    await writeDb(db);
  });
}

export async function deleteHeroService(id: string): Promise<HeroService | null> {
  return withLock(async () => {
    const db = await readDb();
    const index = db.heroServices.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const [removed] = db.heroServices.splice(index, 1);
    await writeDb(db);
    return removed;
  });
}
