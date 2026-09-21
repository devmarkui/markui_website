"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { verifyCredentials } from "@/lib/auth-token";
import {
  createSession,
  destroySession,
  LOGIN_PATH,
  requireAdmin,
} from "@/lib/auth";
import {
  createProduct,
  createProject,
  createService,
  createTopWork,
  deleteProduct,
  deleteProject,
  deleteService,
  deleteTopWork,
  getProduct,
  getProject,
  getService,
  getTopWorkItem,
  updateProduct,
  updateProject,
  updateService,
  getServices,
  getTopWork,
  getProducts,
  getProjects,
  reorderProducts,
  reorderProjects,
  reorderServices,
  reorderTopWork,
  updateSettings,
  updateTopWork,
  type ProductInput,
  type ProjectInput,
  type ServiceInput,
  type TopWorkInput,
} from "@/lib/db";
import {
  deleteUpload,
  isFilled,
  saveUpload,
  UPLOAD_URL_PREFIX,
  UploadError,
} from "@/lib/uploads";
import {
  isProductStatus,
  isProjectCategory,
  type MediaItem,
  type GalleryItem,
  type TopWorkMediaType,
} from "@/lib/types";

export interface FormState {
  ok?: boolean;
  message?: string;
  error?: string;
}

/** Public routes that render project, service or product data. */
const PUBLIC_PATHS = [
  "/",
  "/projects",
  "/products",
  "/services",
  "/products-services",
];

const ADMIN_PATHS = [
  "/admin",
  "/admin/projects",
  "/admin/products",
  "/admin/services",
  "/admin/top-work",
  "/admin/settings",
];

function revalidatePublicSite() {
  for (const path of PUBLIC_PATHS) revalidatePath(path);
  // Every service detail page at once.
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/projects/[slug]", "page");
  for (const path of ADMIN_PATHS) revalidatePath(path);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** A Top Work video link: an absolute http(s) URL or a site-relative path. */
function isVideoUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

/** Splits a textarea of one-per-line (or comma separated) values into a list. */
function list(formData: FormData, key: string) {
  return text(formData, key)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// ─── Authentication ──────────────────────────────────────────────────────────

/** Only ever redirect within the admin area — never to a caller-supplied host. */
function safeNext(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//")
    ? value
    : "/admin";
}

export async function login(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = text(formData, "username");
  const password = text(formData, "password");
  const next = safeNext(text(formData, "next"));

  if (!username || !password) {
    return { error: "Enter both your username and password." };
  }

  if (!verifyCredentials(username, password)) {
    // Deliberately vague: do not reveal which half was wrong.
    return { error: "Incorrect username or password." };
  }

  await createSession(username);
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect(LOGIN_PATH);
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function saveProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const category = text(formData, "category");

  if (!title) return { error: "Project title is required." };
  if (!description) return { error: "Project description is required." };
  if (!isProjectCategory(category)) {
    return { error: "Choose a category for this project." };
  }

  const coverType = text(formData, "coverType") === "video" ? "video" : "image";
  const coverVideoUrl = text(formData, "coverVideoUrl");
  if (coverVideoUrl && !isVideoUrl(coverVideoUrl)) {
    return {
      error:
        "The cover video URL must be a direct http(s) link to a video file (MP4 or WebM).",
    };
  }

  const portfolioUrl = text(formData, "portfolioUrl");
  if (portfolioUrl && !isHttpUrl(portfolioUrl)) {
    return { error: "The portfolio URL must start with https:// or http://." };
  }

  const existing = id ? await getProject(id) : null;
  if (id && !existing) return { error: "That project no longer exists." };

  // Only link services that still exist.
  const knownServices = new Set(
    (await getServices({ includeInactive: true })).map((s) => s.id),
  );
  const serviceIds = formData
    .getAll("serviceIds")
    .map(String)
    .filter((sid) => knownServices.has(sid));

  // Anything written to disk before a later validation failure has to be
  // cleaned up, so collect new files first and only commit at the end.
  const written: string[] = [];

  try {
    let image = existing?.image ?? "";

    const imageFile = formData.get("image");
    if (isFilled(imageFile)) {
      const saved = await saveUpload(imageFile, "image");
      written.push(saved.url);
      image = saved.url;
    } else if (checkbox(formData, "removeImage")) {
      image = "";
    }

    let media: MediaItem[] = existing?.media ?? [];

    const removed = new Set(formData.getAll("removeMedia").map(String));
    if (removed.size) media = media.filter((m) => !removed.has(m.url));

    // Cover video: an uploaded file wins over a pasted URL; an uploaded video
    // already on the project is kept unless the admin ticks "remove".
    let coverVideo = "";
    const coverVideoFile = formData.get("coverVideoFile");
    if (isFilled(coverVideoFile)) {
      const saved = await saveUpload(coverVideoFile);
      written.push(saved.url);
      if (saved.type !== "video") {
        throw new UploadError(`"${coverVideoFile.name}" is not a video file.`);
      }
      coverVideo = saved.url;
    } else if (coverVideoUrl) {
      coverVideo = coverVideoUrl;
    } else if (
      existing?.coverVideo?.startsWith(UPLOAD_URL_PREFIX) &&
      !checkbox(formData, "removeCoverVideo")
    ) {
      coverVideo = existing.coverVideo;
    }
    if (coverType === "video" && !coverVideo) {
      throw new UploadError(
        "Upload a cover video or paste its URL — or switch the cover back to an image.",
      );
    }

    const gallery = await readGalleryItems(
      formData,
      "gallery",
      existing?.gallery ?? [],
      written,
    );

    const input: ProjectInput = {
      title,
      description,
      fullDescription: text(formData, "fullDescription") || undefined,
      outcome: text(formData, "outcome") || undefined,
      client: text(formData, "client") || undefined,
      category,
      image,
      coverType,
      coverVideo: coverVideo || undefined,
      link: text(formData, "link") || undefined,
      portfolioUrl: portfolioUrl || undefined,
      deliverables: list(formData, "deliverables"),
      serviceIds,
      featured: checkbox(formData, "featured"),
      active: checkbox(formData, "active"),
      date: text(formData, "date") || undefined,
      industry: text(formData, "industry") || undefined,
      tag: text(formData, "tag") || undefined,
      size: text(formData, "size") === "large" ? "large" : "small",
      media,
      gallery,
    };

    if (existing) {
      await updateProject(existing.id, input);
      // Old files are only unlinked once the new record is safely stored.
      if (existing.image && existing.image !== image) {
        await deleteUpload(existing.image);
      }
      if (existing.coverVideo && existing.coverVideo !== coverVideo) {
        await deleteUpload(existing.coverVideo);
      }
      for (const url of removed) await deleteUpload(url);
      const kept = new Set(galleryFiles(gallery));
      for (const url of galleryFiles(existing.gallery ?? [])) {
        if (!kept.has(url)) await deleteUpload(url);
      }
    } else {
      await createProject(input);
    }

    revalidatePublicSite();
    return {
      ok: true,
      message: existing
        ? `"${title}" updated — the website has been refreshed.`
        : `"${title}" added — it is now live on the website.`,
    };
  } catch (error) {
    for (const url of written) await deleteUpload(url);
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

export async function removeProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing project id." };

  const removed = await deleteProject(id);
  if (!removed) return { error: "That project no longer exists." };

  await deleteUpload(removed.project.image);
  await deleteUpload(removed.project.coverVideo);
  for (const url of galleryFiles(removed.project.gallery ?? [])) {
    await deleteUpload(url);
  }
  for (const item of removed.project.media) await deleteUpload(item.url);
  // Top Work that pointed at this project went with it.
  for (const work of removed.topWork) {
    await deleteUpload(work.image);
    await deleteUpload(work.video);
    for (const item of work.media) await deleteUpload(item.url);
  }

  revalidatePublicSite();
  return {
    ok: true,
    message: `"${removed.project.title}" deleted — it has been removed from the website.`,
  };
}

/** Moves one project up or down in the public display order. */
export async function moveProject(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id) return { error: "Missing project id." };

  const projects = await getProjects({ includeInactive: true });
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return { error: "That project no longer exists." };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= projects.length) return { ok: true };

  const ordered = [...projects];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderProjects(ordered.map((p) => p.id));

  revalidatePublicSite();
  return { ok: true, message: "Order updated." };
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function saveService(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  const shortDescription = text(formData, "shortDescription");

  if (!name) return { error: "Service name is required." };
  if (!shortDescription) return { error: "A short description is required." };

  const existing = id ? await getService(id) : null;
  if (id && !existing) return { error: "That service no longer exists." };

  const written: string[] = [];

  try {
    let image = existing?.image ?? "";

    const imageFile = formData.get("image");
    if (isFilled(imageFile)) {
      const saved = await saveUpload(imageFile, "image");
      written.push(saved.url);
      image = saved.url;
    } else if (checkbox(formData, "removeImage")) {
      image = "";
    }

    const input: ServiceInput = {
      name,
      slug: text(formData, "slug") || undefined,
      shortDescription,
      fullDescription: text(formData, "fullDescription") || shortDescription,
      image,
      icon: text(formData, "icon") || "◆",
      features: list(formData, "features"),
      benefits: list(formData, "benefits"),
      tags: list(formData, "tags"),
      active: checkbox(formData, "active"),
    };

    const saved = existing
      ? await updateService(existing.id, input)
      : await createService(input);

    if (existing && existing.image && existing.image !== image) {
      await deleteUpload(existing.image);
    }

    revalidatePublicSite();
    return {
      ok: true,
      message: existing
        ? `"${name}" updated — live at /services/${saved?.slug ?? ""}.`
        : `"${name}" added — live at /services/${saved?.slug ?? ""}.`,
    };
  } catch (error) {
    for (const url of written) await deleteUpload(url);
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

export async function removeService(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing service id." };

  const removed = await deleteService(id);
  if (!removed) return { error: "That service no longer exists." };

  await deleteUpload(removed.service.image);
  // The cascaded Top Work owned files too; a linked project's image is left
  // alone because `deleteUpload` only touches uploads, not `/public` paths.
  for (const work of removed.topWork) {
    await deleteUpload(work.image);
    await deleteUpload(work.video);
    for (const item of work.media) await deleteUpload(item.url);
  }

  revalidatePublicSite();
  return {
    ok: true,
    message: `"${removed.service.name}" deleted — it and its ${removed.topWork.length} Top Work ${removed.topWork.length === 1 ? "entry has" : "entries have"} been removed from the website.`,
  };
}

/** Moves a service one place up or down in the public ordering. */
export async function moveService(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id) return { error: "Missing service id." };

  const services = await getServices({ includeInactive: true });
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) return { error: "That service no longer exists." };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= services.length) return { ok: true };

  const ordered = [...services];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderServices(ordered.map((s) => s.id));

  revalidatePublicSite();
  return { ok: true, message: "Order updated." };
}

// ─── Top Work ────────────────────────────────────────────────────────────────

export async function saveTopWork(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const serviceId = text(formData, "serviceId");
  const projectId = text(formData, "projectId");
  const title = text(formData, "title");

  if (!serviceId) return { error: "Choose which service this work belongs to." };

  const service = await getService(serviceId);
  if (!service) return { error: "That service no longer exists." };

  // Linked items borrow the project's title; standalone ones need their own.
  if (!projectId && !title) {
    return {
      error:
        "Either pick an existing project, or give this work a title of its own.",
    };
  }

  const project = projectId ? await getProject(projectId) : null;
  if (projectId && !project) {
    return { error: "That project no longer exists." };
  }

  const mediaType: TopWorkMediaType =
    text(formData, "mediaType") === "video" ? "video" : "image";

  const videoUrl = text(formData, "videoUrl");
  if (videoUrl && !isVideoUrl(videoUrl)) {
    return {
      error:
        "The video URL must be a direct http(s) link to a video file (MP4 or WebM).",
    };
  }

  const existing = id ? await getTopWorkItem(id) : null;
  if (id && !existing) return { error: "That Top Work item no longer exists." };

  const written: string[] = [];

  try {
    let image = existing?.image ?? "";

    const imageFile = formData.get("image");
    if (isFilled(imageFile)) {
      const saved = await saveUpload(imageFile, "image");
      written.push(saved.url);
      image = saved.url;
    } else if (checkbox(formData, "removeImage")) {
      image = "";
    }

    let media: MediaItem[] = existing?.media ?? [];

    const removed = new Set(formData.getAll("removeMedia").map(String));
    if (removed.size) media = media.filter((m) => !removed.has(m.url));

    for (const entry of formData.getAll("media")) {
      if (!isFilled(entry)) continue;
      const saved = await saveUpload(entry);
      written.push(saved.url);
      media = [...media, saved];
    }

    // An uploaded file wins over a pasted URL; an uploaded video already on
    // the item is kept unless the admin ticks "remove".
    let video = "";
    const videoFile = formData.get("videoFile");
    if (isFilled(videoFile)) {
      const saved = await saveUpload(videoFile);
      written.push(saved.url);
      if (saved.type !== "video") {
        throw new UploadError(`"${videoFile.name}" is not a video file.`);
      }
      video = saved.url;
    } else if (videoUrl) {
      video = videoUrl;
    } else if (
      existing?.video?.startsWith(UPLOAD_URL_PREFIX) &&
      !checkbox(formData, "removeVideo")
    ) {
      video = existing.video;
    }

    if (mediaType === "video") {
      const hasVideo =
        video ||
        media.some((m) => m.type === "video") ||
        project?.media.some((m) => m.type === "video");
      if (!hasVideo) {
        throw new UploadError("Upload a video, or paste a video URL.");
      }
    } else if (!image && !project?.image) {
      throw new UploadError("Upload an image for this work.");
    }

    const input: TopWorkInput = {
      serviceId,
      projectId: projectId || undefined,
      title,
      description: text(formData, "description"),
      mediaType,
      image,
      video: video || undefined,
      category: text(formData, "category") || undefined,
      media,
      link: text(formData, "link") || undefined,
      active: checkbox(formData, "active"),
    };

    if (existing) {
      await updateTopWork(existing.id, input);
      if (existing.image && existing.image !== image) {
        await deleteUpload(existing.image);
      }
      if (existing.video && existing.video !== video) {
        await deleteUpload(existing.video);
      }
      for (const url of removed) await deleteUpload(url);
    } else {
      await createTopWork(input);
    }

    revalidatePublicSite();
    return {
      ok: true,
      message: existing
        ? `Top Work updated on ${service.name}.`
        : `Top Work added to ${service.name}.`,
    };
  } catch (error) {
    for (const url of written) await deleteUpload(url);
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

export async function removeTopWork(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing Top Work id." };

  const removed = await deleteTopWork(id);
  if (!removed) return { error: "That Top Work item no longer exists." };

  // Only unlink files this item owned — never a linked project's image.
  await deleteUpload(removed.image);
  await deleteUpload(removed.video);
  for (const item of removed.media) await deleteUpload(item.url);

  revalidatePublicSite();
  return {
    ok: true,
    message: "Top Work removed from that service.",
  };
}

/** Moves one Top Work item up or down within its own service. */
export async function moveTopWork(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id) return { error: "Missing Top Work id." };

  const item = await getTopWorkItem(id);
  if (!item) return { error: "That Top Work item no longer exists." };

  const siblings = await getTopWork(item.serviceId);
  const index = siblings.findIndex((w) => w.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) return { ok: true };

  const ordered = [...siblings];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderTopWork(item.serviceId, ordered.map((w) => w.id));

  revalidatePublicSite();
  return { ok: true, message: "Order updated." };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProduct(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  const shortDescription = text(formData, "shortDescription");
  const status = text(formData, "status");

  if (!name) return { error: "Product name is required." };
  if (!shortDescription) return { error: "A short description is required." };
  if (status && !isProductStatus(status)) {
    return { error: "Choose a valid product status." };
  }

  const existing = id ? await getProduct(id) : null;
  if (id && !existing) return { error: "That product no longer exists." };

  const written: string[] = [];

  try {
    let image = existing?.image ?? "";

    const imageFile = formData.get("image");
    if (isFilled(imageFile)) {
      const saved = await saveUpload(imageFile, "image");
      written.push(saved.url);
      image = saved.url;
    } else if (checkbox(formData, "removeImage")) {
      image = "";
    }

    let logo = existing?.logo ?? "";

    const logoFile = formData.get("logo");
    if (isFilled(logoFile)) {
      const saved = await saveUpload(logoFile, "image");
      written.push(saved.url);
      logo = saved.url;
    } else if (checkbox(formData, "removeLogo")) {
      logo = "";
    }

    let media: MediaItem[] = existing?.media ?? [];

    const removed = new Set(formData.getAll("removeMedia").map(String));
    if (removed.size) media = media.filter((m) => !removed.has(m.url));

    const preview = await readGalleryItems(
      formData,
      "preview",
      existing?.preview ?? [],
      written,
    );

    const input: ProductInput = {
      name,
      shortDescription,
      fullDescription: text(formData, "fullDescription") || shortDescription,
      image,
      logo: logo || undefined,
      icon: text(formData, "icon") || "▣",
      category: text(formData, "category") || undefined,
      status: isProductStatus(status) ? status : "available",
      features: list(formData, "features"),
      technologies: list(formData, "technologies"),
      preview,
      price: text(formData, "price") || undefined,
      link: text(formData, "link") || undefined,
      ctaLabel: text(formData, "ctaLabel") || undefined,
      media,
      active: checkbox(formData, "active"),
    };

    if (existing) {
      await updateProduct(existing.id, input);
      if (existing.image && existing.image !== image) {
        await deleteUpload(existing.image);
      }
      if (existing.logo && existing.logo !== logo) {
        await deleteUpload(existing.logo);
      }
      for (const url of removed) await deleteUpload(url);

      // Files that no preview item points at any more.
      const kept = new Set(galleryFiles(preview));
      for (const url of galleryFiles(existing.preview ?? [])) {
        if (!kept.has(url)) await deleteUpload(url);
      }
    } else {
      await createProduct(input);
    }

    revalidatePublicSite();
    return {
      ok: true,
      message: existing
        ? `"${name}" updated — the website has been refreshed.`
        : `"${name}" added — it is now live on the Products page.`,
    };
  } catch (error) {
    for (const url of written) await deleteUpload(url);
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }
}

function galleryFiles(items: GalleryItem[]) {
  return items.flatMap((item) =>
    [item.image, item.video].filter((url): url is string => Boolean(url)),
  );
}

/**
 * Rebuilds an ordered media list (a product's preview, a project's gallery)
 * from the shared `GalleryEditor`.
 *
 * The form sends one `<prefix>Key` per item in display order — an existing
 * item's id, or a fresh key for a new one — and that item's fields under
 * `<prefix>.<key>.<field>`. Items the admin deleted simply are not sent.
 * Every file written is pushed onto `written` so a failed save can undo it.
 */
async function readGalleryItems(
  formData: FormData,
  prefix: string,
  current: GalleryItem[],
  written: string[],
): Promise<GalleryItem[]> {
  const byId = new Map(current.map((item) => [item.id, item]));
  const items: GalleryItem[] = [];

  for (const key of formData.getAll(`${prefix}Key`).map(String)) {
    const field = (name: string) => `${prefix}.${key}.${name}`;
    const before = byId.get(key);
    const type = text(formData, field("type")) === "video" ? "video" : "image";
    const title = text(formData, field("title"));
    const label = title ? `"${title}"` : `media item ${items.length + 1}`;

    let image = before?.image ?? "";
    const imageFile = formData.get(field("imageFile"));
    if (isFilled(imageFile)) {
      const saved = await saveUpload(imageFile, "image");
      written.push(saved.url);
      image = saved.url;
    } else if (checkbox(formData, field("removeImage"))) {
      image = "";
    }

    let video = "";
    if (type === "video") {
      const videoUrl = text(formData, field("videoUrl"));
      const videoFile = formData.get(field("videoFile"));
      if (isFilled(videoFile)) {
        const saved = await saveUpload(videoFile);
        written.push(saved.url);
        if (saved.type !== "video") {
          throw new UploadError(`"${videoFile.name}" is not a video file.`);
        }
        video = saved.url;
      } else if (videoUrl) {
        if (!isVideoUrl(videoUrl)) {
          throw new UploadError(
            `The video URL for ${label} must be a direct http(s) link to an MP4 or WebM file.`,
          );
        }
        video = videoUrl;
      } else if (
        before?.video?.startsWith(UPLOAD_URL_PREFIX) &&
        !checkbox(formData, field("removeVideo"))
      ) {
        video = before.video;
      }
      if (!video) {
        throw new UploadError(`Add a video file or video URL for ${label}.`);
      }
    } else if (!image) {
      throw new UploadError(`Upload an image for ${label}.`);
    }

    items.push({
      id: before?.id ?? randomUUID(),
      type,
      title,
      image,
      video: video || undefined,
      active: checkbox(formData, field("active")),
    });
  }

  return items;
}

/** Moves one product up or down in the public display order. */
export async function moveProduct(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!id) return { error: "Missing product id." };

  const products = await getProducts({ includeInactive: true });
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return { error: "That product no longer exists." };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= products.length) return { ok: true };

  const ordered = [...products];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderProducts(ordered.map((p) => p.id));

  revalidatePublicSite();
  return { ok: true, message: "Order updated." };
}

export async function removeProduct(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing product id." };

  const removed = await deleteProduct(id);
  if (!removed) return { error: "That product no longer exists." };

  await deleteUpload(removed.image);
  await deleteUpload(removed.logo);
  for (const item of removed.media) await deleteUpload(item.url);
  for (const url of galleryFiles(removed.preview ?? [])) await deleteUpload(url);

  revalidatePublicSite();
  return {
    ok: true,
    message: `"${removed.name}" deleted — it has been removed from the website.`,
  };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function saveSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const portfolioUrl = text(formData, "portfolioUrl");

  if (portfolioUrl) {
    let parsed: URL;
    try {
      parsed = new URL(portfolioUrl);
    } catch {
      return {
        error:
          "Enter a full URL including https://, for example https://portfolio.markui.lk",
      };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { error: "The portfolio URL must start with https:// or http://" };
    }
  }

  await updateSettings({ portfolioUrl });
  revalidatePublicSite();

  return {
    ok: true,
    message: portfolioUrl
      ? "Portfolio link saved — the button now appears on every service page."
      : "Portfolio link cleared — the button is hidden until you add one.",
  };
}
