"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  checkCredentials,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  updateCredentials,
  USERNAME_PATTERN,
} from "@/lib/admin-account";
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
  getSettings,
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
import { deleteEnquiry } from "@/lib/enquiries";
import { BODY_LIMITS, HEADING_LIMITS, richFromLines, sanitizeRichDoc } from "@/lib/rich-text";
import {
  HOME_REASONS,
  HOME_STEPS,
  LIMITS as CONTENT_LIMITS,
  MAX_FAQS,
  MAX_PROMISES,
  MAX_REVIEWS,
  MIN_PROMISES,
  type PageCopy,
  type SiteContent,
} from "@/lib/site-content";
import {
  deleteUpload,
  isFilled,
  saveUpload,
  UPLOAD_URL_PREFIX,
  UploadError,
} from "@/lib/uploads";
import {
  HERO_LINE_MAX,
  MAX_CONTACT_PHONES,
  MAX_SOCIAL_LINKS,
  MAX_TRUST_LOGOS,
  MAX_TRUST_STATS,
  isProductStatus,
  isProjectCategory,
  type ContactPhone,
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
  // The homepage itself: `/` is rewritten to this route (next.config.ts).
  "/landing-home",
  "/about",
  "/contact",
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
  "/admin/about",
  "/admin/home",
  "/admin/contact",
  "/admin/reviews",
  "/admin/pages",
  "/admin/footer",
  "/admin/account",
  "/admin/enquiries",
  "/admin/trust",
];

function revalidatePublicSite() {
  // The footer lists every active service, so a service change reaches every
  // public page; the paths below are refreshed with it.
  revalidatePath("/", "layout");
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

/** A destination the site can link to: a site path or a full http(s) URL. */
function isLinkTarget(value: string) {
  return (value.startsWith("/") && !value.startsWith("//")) || isHttpUrl(value);
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

  if (!(await checkCredentials(username, password))) {
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

/**
 * Changes the admin username and/or password. The current password is always
 * required; a blank new password keeps the current one. Every other signed-in
 * browser is signed out, and this one gets a fresh session.
 */
export async function saveAccount(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin();

  // Trimmed, exactly as `login` trims what it checks.
  const username = text(formData, "username");
  const currentPassword = text(formData, "currentPassword");
  const newPassword = text(formData, "newPassword");
  const confirmPassword = text(formData, "confirmPassword");

  if (!currentPassword) {
    return { error: "Enter your current password to confirm the change." };
  }
  if (!(await checkCredentials(session.u, currentPassword))) {
    return { error: "Your current password is incorrect." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Usernames are 3–64 characters: letters, numbers, and . _ @ - only.",
    };
  }
  if (newPassword) {
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return { error: `The new password needs at least ${PASSWORD_MIN_LENGTH} characters.` };
    }
    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      return { error: `The new password can be at most ${PASSWORD_MAX_LENGTH} characters.` };
    }
    if (newPassword !== confirmPassword) {
      return { error: "The new password and its confirmation do not match." };
    }
  }

  const usernameChanged = username !== session.u;
  if (!usernameChanged && !newPassword) {
    return { error: "Nothing to change — enter a new username or a new password." };
  }

  await updateCredentials(username, newPassword || currentPassword);
  await createSession(username);
  revalidatePath("/admin", "layout");

  const changed = [usernameChanged && "username", newPassword && "password"]
    .filter(Boolean)
    .join(" and ");
  return {
    ok: true,
    message: `Your ${changed} has been updated. Any other signed-in browsers have been signed out.`,
  };
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

  // Blank keeps the button pointing at this service's own detail page.
  const ctaLink = text(formData, "ctaLink");
  if (ctaLink && !ctaLink.startsWith("/") && !isHttpUrl(ctaLink)) {
    return {
      error:
        "The button link must start with / for a page on this site, or https:// for another site.",
    };
  }

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
      ctaLink: ctaLink || undefined,
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

// ─── Contact details ─────────────────────────────────────────────────────────

const CONTACT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Phone numbers, WhatsApp, email, address and hours (Contact Details). They
 * are printed and linked on every page, so each number has to be one a phone
 * can actually dial: international format, digits and spaces only.
 */
export async function saveContactDetails(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const phones: ContactPhone[] = [];
  for (let i = 0; i < MAX_CONTACT_PHONES; i += 1) {
    const number = text(formData, `phone${i}`).replace(/\s+/g, " ");
    if (!number) continue;
    if (!/^\+[\d ]+$/.test(number)) {
      return {
        error: `"${number}" should start with + and the country code and contain only digits and spaces, for example +94 76 088 7702.`,
      };
    }
    const digits = number.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      return { error: `"${number}" looks too short or too long for a phone number.` };
    }
    if (phones.some((p) => p.number.replace(/\D/g, "") === digits)) {
      return { error: `"${number}" is listed twice.` };
    }
    phones.push({ number, whatsapp: checkbox(formData, `whatsapp${i}`) });
  }
  if (!phones.length) return { error: "Add at least one phone number." };

  const email = text(formData, "email");
  if (!CONTACT_EMAIL.test(email)) {
    return { error: "Enter a full email address, for example info@markui.lk." };
  }

  const location = text(formData, "location");
  const address = text(formData, "address");
  const hours = text(formData, "hours");
  if (!location || !address || !hours) {
    return { error: "The short location, the studio address and the opening hours are all required." };
  }
  if (location.length > 60 || address.length > 160 || hours.length > 80) {
    return { error: "One of the fields is too long. Location: 60 characters, address: 160, hours: 80." };
  }

  await updateSettings({ contact: { phones, email, location, address, hours } });
  revalidatePublicSite();

  return { ok: true, message: "Contact details saved. Every page now shows them." };
}

/** One editable row per line: `Title | Description`. */
function pairedItems(formData: FormData, key: string) {
  return text(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const divider = line.indexOf("|");
      return divider === -1
        ? { title: line, description: "" }
        : {
            title: line.slice(0, divider).trim(),
            description: line.slice(divider + 1).trim(),
          };
    })
    .filter((item) => item.title);
}

export async function saveAboutSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const heroHeading = text(formData, "heroHeading");
  const introduction = text(formData, "introduction");
  const whoWeAre = text(formData, "whoWeAre");
  const ctaHeading = text(formData, "ctaHeading");
  const ctaText = text(formData, "ctaText");

  if (!heroHeading || !introduction || !whoWeAre || !ctaHeading || !ctaText) {
    return { error: "Hero, company description and call-to-action fields are required." };
  }

  const approach = pairedItems(formData, "approach");
  const reasons = pairedItems(formData, "reasons");
  const values = pairedItems(formData, "values");

  if (!approach.length || !reasons.length || !values.length) {
    return { error: "Add at least one row to each editable list." };
  }

  // "Our expertise" is no longer shown on the About page or edited here; the
  // stored list is carried over unchanged.
  const { about: current } = await getSettings();

  await updateSettings({
    about: {
      heroHeading,
      introduction,
      whoWeAre,
      approach,
      reasons,
      expertise: current.expertise,
      values,
      ctaHeading,
      ctaText,
    },
  });
  revalidatePublicSite();

  return { ok: true, message: "About page content saved and published." };
}

// ─── Home page ───────────────────────────────────────────────────────────────

export async function saveHomeSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  // The hero sets its own type: the headline is two plain lines (the first
  // light, the second bold) and the description one plain paragraph. They are
  // still stored as rich text documents, which is what the store holds.
  const quiet = text(formData, "headingQuiet").replace(/\s+/g, " ");
  const loud = text(formData, "headingLoud").replace(/\s+/g, " ");
  const paragraph = text(formData, "description").replace(/\s+/g, " ");
  if (!quiet || !loud) {
    return { error: "The headline needs both lines." };
  }
  if (quiet.length > HERO_LINE_MAX || loud.length > HERO_LINE_MAX) {
    return { error: `Each headline line can be at most ${HERO_LINE_MAX} characters, or it will not fit the hero.` };
  }
  if (!paragraph) {
    return { error: "The paragraph under the headline is required." };
  }
  if (paragraph.length > 220) {
    return { error: "Keep the paragraph under the headline to 220 characters." };
  }
  const heading = sanitizeRichDoc(
    richFromLines([{ text: quiet }, { text: loud, marks: { weight: 800 } }]),
    HEADING_LIMITS,
  );
  const description = sanitizeRichDoc(richFromLines([{ text: paragraph }]), BODY_LIMITS);
  if (!heading || !description) {
    return { error: "That text could not be saved. Remove any unusual characters and try again." };
  }

  const home = {
    heading,
    description,
    ctaText: text(formData, "ctaText"),
    ctaLink: text(formData, "ctaLink"),
    itTitle: text(formData, "itTitle"),
    itDescription: text(formData, "itDescription"),
    itLink: text(formData, "itLink"),
    marketingTitle: text(formData, "marketingTitle"),
    marketingDescription: text(formData, "marketingDescription"),
    marketingLink: text(formData, "marketingLink"),
    mediaTitle: text(formData, "mediaTitle"),
    mediaDescription: text(formData, "mediaDescription"),
    mediaLink: text(formData, "mediaLink"),
    // The button's size, weight and colour come from the design now.
    ctaSize: undefined,
    ctaWeight: undefined,
    ctaColor: undefined,
  };

  if (!home.ctaText || !home.ctaLink) {
    return { error: "Both the button text and the button link are required." };
  }
  if (!home.itTitle || !home.marketingTitle || !home.mediaTitle) {
    return { error: "All three channels need a name." };
  }
  for (const [label, link] of [
    ["button link", home.ctaLink],
    ["Channel 01 link", home.itLink],
    ["Channel 02 link", home.marketingLink],
    ["Channel 03 link", home.mediaLink],
  ]) {
    if (link && !isLinkTarget(link)) {
      return {
        error: `The ${label} must be a site path such as /contact, or a full URL starting with https://.`,
      };
    }
  }

  await updateSettings({ home });
  revalidatePublicSite();

  return { ok: true, message: "Home page saved. The homepage now shows it." };
}

// ─── Footer social links ─────────────────────────────────────────────────────

export async function saveSocialLinks(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  // One label/url pair per row, in the order the admin arranged them.
  const labels = formData.getAll("socialLabel").map((v) => String(v).trim());
  const urls = formData.getAll("socialUrl").map((v) => String(v).trim());

  const socialLinks = labels
    .map((label, i) => ({ label, url: urls[i] ?? "" }))
    .filter((row) => row.label || row.url);

  if (socialLinks.length > MAX_SOCIAL_LINKS) {
    return { error: `Add at most ${MAX_SOCIAL_LINKS} social links.` };
  }
  for (const [i, row] of socialLinks.entries()) {
    if (!row.label) return { error: `Link ${i + 1} needs a name, e.g. Instagram.` };
    if (!row.url || !isHttpUrl(row.url)) {
      return {
        error: `The ${row.label} address must be a full URL starting with https://, e.g. https://instagram.com/markui.lk`,
      };
    }
  }

  await updateSettings({ socialLinks });
  // The footer is on every public page, so refresh them all.
  revalidatePath("/", "layout");

  return {
    ok: true,
    message: socialLinks.length
      ? "Social links saved — the footer on every page has been updated."
      : "All social links removed from the footer.",
  };
}

// ─── Enquiries ───────────────────────────────────────────────────────────────

export async function removeEnquiry(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) return { error: "Missing enquiry id." };

  await deleteEnquiry(id);
  revalidatePath("/admin/enquiries");

  return { ok: true, message: "Enquiry deleted." };
}

// ─── Home trust strip ────────────────────────────────────────────────────────

export async function saveTrustSettings(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const headingDark = text(formData, "trustHeadingDark");
  const headingMuted = text(formData, "trustHeadingMuted");
  if (!headingDark) {
    return { error: "The headline needs its first sentence." };
  }

  // One set of inputs per row, in the order the admin arranged them.
  const statLabels = formData.getAll("statLabel").map((v) => String(v).trim());
  const statValues = formData.getAll("statValue").map((v) => String(v).trim());
  const statSuffixes = formData.getAll("statSuffix").map((v) => String(v).trim());
  const statDescriptions = formData
    .getAll("statDescription")
    .map((v) => String(v).trim());

  const stats = statLabels
    .map((label, i) => ({
      label,
      value: statValues[i] ?? "",
      suffix: statSuffixes[i] ?? "",
      description: statDescriptions[i] ?? "",
    }))
    .filter((row) => row.label || row.value || row.description);

  if (stats.length > MAX_TRUST_STATS) {
    return { error: `Add at most ${MAX_TRUST_STATS} stat cards.` };
  }
  for (const [i, row] of stats.entries()) {
    if (!row.label) return { error: `Stat card ${i + 1} needs a label.` };
    if (!row.value) return { error: `Stat card ${i + 1} needs a figure, e.g. 100%.` };
  }

  const logoNames = formData.getAll("logoName").map((v) => String(v).trim());
  const logoIcons = formData.getAll("logoIcon").map((v) => String(v).trim());

  const logos = logoNames
    .map((name, i) => ({ name, icon: (logoIcons[i] ?? "").slice(0, 4) }))
    .filter((row) => row.name || row.icon);

  if (logos.length > MAX_TRUST_LOGOS) {
    return { error: `Add at most ${MAX_TRUST_LOGOS} client names.` };
  }
  for (const [i, row] of logos.entries()) {
    if (!row.name) return { error: `Client ${i + 1} needs a name.` };
  }

  await updateSettings({ trust: { headingDark, headingMuted, stats, logos } });
  // The homepage's Proof section and the About page both show them.
  revalidatePublicSite();

  return { ok: true, message: "Saved. The homepage and the About page now show it." };
}

// ─── Site content: homepage sections, reviews, page text, contact page ───────
// One JSON document (lib/site-content.ts). Each screen saves its own part and
// leaves the rest as it is. Every field has a length it must fit, because the
// layout it goes into was drawn for text of about that length.

/** Collects the first problem found while reading a form. */
class FormReader {
  error: string | null = null;

  constructor(private readonly formData: FormData) {}

  private fail(message: string) {
    if (!this.error) this.error = message;
  }

  /** One text field: collapsed to a single line, checked against its limit. */
  text(key: string, label: string, max: number, required = true): string {
    const value = text(this.formData, key).replace(/\s+/g, " ");
    return this.check(value, label, max, required);
  }

  /** Every value posted under one name, in order (a list's rows). */
  all(key: string): string[] {
    return this.formData.getAll(key).map((v) => String(v).replace(/\s+/g, " ").trim());
  }

  check(value: string, label: string, max: number, required = true): string {
    if (required && !value) this.fail(`${label} is required.`);
    else if (value.length > max) this.fail(`${label} can be at most ${max} characters (it has ${value.length}).`);
    return value;
  }
}

/** The stored document must fit the column it is kept in. */
function contentTooLarge(content: SiteContent) {
  return Buffer.byteLength(JSON.stringify(content), "utf8") > 60_000;
}

async function saveContent(content: SiteContent, message: string): Promise<FormState> {
  if (contentTooLarge(content)) {
    return { error: "There is too much text to store. Shorten the longest reviews or answers and save again." };
  }
  await updateSettings({ content });
  revalidatePublicSite();
  return { ok: true, message };
}

/** Home Page → the text of the sections under the hero, and the search title. */
export async function saveHomeSections(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { content } = await getSettings();
  const form = new FormReader(formData);
  const L = CONTENT_LIMITS;

  const reasonLabels = form.all("reasonLabel");
  const reasonTitles = form.all("reasonTitle");
  const reasonTexts = form.all("reasonText");
  const stepNames = form.all("stepName");
  const stepTexts = form.all("stepText");
  if (reasonLabels.length !== HOME_REASONS || stepNames.length !== HOME_STEPS) {
    return { error: "The homepage needs exactly four reasons and four stages." };
  }

  const home: SiteContent["home"] = {
    eyebrow: form.text("eyebrow", "The line above the headline", L.eyebrow),
    servicesIntro: form.text("servicesIntro", "The services introduction", L.servicesIntro),
    workTitle: form.text("workTitle", "The projects heading", L.workTitle),
    reviewsNote: content.home.reviewsNote,
    whyTitle: form.text("whyTitle", "The Why heading", L.whyTitle),
    reasons: reasonLabels.map((label, i) => ({
      label: form.check(label, `Reason ${i + 1}: the short name`, L.reasonLabel),
      title: form.check(reasonTitles[i] ?? "", `Reason ${i + 1}: the headline`, L.reasonTitle),
      text: form.check(reasonTexts[i] ?? "", `Reason ${i + 1}: the text`, L.reasonText),
    })),
    processKicker: form.text("processKicker", "The process heading, first part", L.processKicker),
    processTitle: form.text("processTitle", "The process heading, second part", L.processTitle),
    steps: stepNames.map((name, i) => ({
      name: form.check(name, `Stage ${i + 1}: the name`, L.stepName),
      text: form.check(stepTexts[i] ?? "", `Stage ${i + 1}: the text`, L.stepText),
    })),
    contactTitle: form.text("contactTitle", "The contact heading", L.contactTitle),
    contactLede: form.text("contactLede", "The contact introduction", L.contactLede),
    seoTitle: form.text("seoTitle", "The search title", L.seoTitle),
    seoDescription: form.text("seoDescription", "The search description", L.seoDescription),
  };
  if (form.error) return { error: form.error };

  return saveContent({ ...content, home }, "Homepage sections saved. The homepage now shows them.");
}

/** Reviews → the homepage's review wall. */
export async function saveReviews(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { content } = await getSettings();
  const form = new FormReader(formData);
  const L = CONTENT_LIMITS;

  const names = form.all("reviewName");
  const texts = form.all("reviewText");
  const leads = form.all("reviewLead");
  const asides = form.all("reviewAside");

  const reviews = names
    .map((name, i) => ({ name, text: texts[i] ?? "", lead: leads[i] ?? "", aside: asides[i] ?? "" }))
    .filter((r) => r.name || r.text || r.lead || r.aside);

  if (!reviews.length) return { error: "Add at least one review." };
  if (reviews.length > MAX_REVIEWS) return { error: `The wall holds at most ${MAX_REVIEWS} reviews.` };
  for (const [i, r] of reviews.entries()) {
    const which = `Review ${i + 1}`;
    form.check(r.name, `${which}: the reviewer's name`, L.reviewName);
    form.check(r.text, `${which}: the review`, L.reviewText, false);
    form.check(r.lead, `${which}: the bold opening line`, L.reviewLead, false);
    form.check(r.aside, `${which}: the sticker note`, L.reviewAside, false);
    if (!r.text && (r.lead || r.aside)) {
      return { error: `${which} has an opening line or a note but no review text. Add the text, or clear them.` };
    }
  }
  if (form.error) return { error: form.error };
  if (!reviews[0].text) {
    return { error: "The first review is the headline one, set largest, so it needs words. Move a short written review to the top." };
  }

  const reviewsNote = form.text("reviewsNote", "The note beside the heading", L.reviewsNote, false);
  if (form.error) return { error: form.error };

  return saveContent(
    { ...content, reviews, home: { ...content.home, reviewsNote } },
    `Saved. The wall now shows ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}.`,
  );
}

function readPageCopy(form: FormReader, key: string, name: string): PageCopy {
  const L = CONTENT_LIMITS;
  return {
    header: {
      label: form.text(`${key}Label`, `${name}: the label`, L.headerLabel),
      quiet: form.text(`${key}Quiet`, `${name}: the title's first part`, L.headerQuiet, false),
      loud: form.text(`${key}Loud`, `${name}: the title's second part`, L.headerLoud).replace(/\.$/, ""),
      lede: form.text(`${key}Lede`, `${name}: the introduction`, L.headerLede),
    },
    cta: {
      quiet: form.text(`${key}CtaQuiet`, `${name}: the closing line's first part`, L.ctaQuiet, false),
      loud: form.text(`${key}CtaLoud`, `${name}: the closing line's second part`, L.ctaLoud).replace(/\.$/, ""),
      text: form.text(`${key}CtaText`, `${name}: the closing text`, L.ctaText),
    },
  };
}

/** Page Text → the header and closing text of Projects, Products and Services, and the footer note. */
export async function savePageText(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { content } = await getSettings();
  const form = new FormReader(formData);

  const projects = readPageCopy(form, "projects", "Projects");
  const products = readPageCopy(form, "products", "Products");
  const services = readPageCopy(form, "services", "Services");
  const footerNote = form.text("footerNote", "The footer note", CONTENT_LIMITS.footerNote);
  if (form.error) return { error: form.error };

  return saveContent(
    { ...content, footerNote, pages: { ...content.pages, projects, products, services } },
    "Page text saved. The pages now show it.",
  );
}

/** Contact → the contact page's header, promises, questions and closing text. */
export async function saveContactPage(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const { content } = await getSettings();
  const form = new FormReader(formData);
  const L = CONTENT_LIMITS;

  const copy = readPageCopy(form, "contact", "Contact");

  const promises = form.all("promise").filter(Boolean);
  if (promises.length < MIN_PROMISES || promises.length > MAX_PROMISES) {
    return { error: `The strip needs between ${MIN_PROMISES} and ${MAX_PROMISES} promises, so it fills the screen without repeating too soon.` };
  }
  promises.forEach((p, i) => form.check(p, `Promise ${i + 1}`, L.promise));

  const questions = form.all("faqQuestion");
  const answers = form.all("faqAnswer");
  const faqs = questions.map((q, i) => ({ q, a: answers[i] ?? "" })).filter((f) => f.q || f.a);
  if (faqs.length > MAX_FAQS) return { error: `Keep the questions to ${MAX_FAQS} at most.` };
  faqs.forEach((f, i) => {
    form.check(f.q, `Question ${i + 1}`, L.faqQuestion);
    form.check(f.a, `Question ${i + 1}: the answer`, L.faqAnswer);
  });
  if (form.error) return { error: form.error };

  return saveContent(
    { ...content, pages: { ...content.pages, contact: { ...copy, promises, faqs } } },
    "Contact page saved.",
  );
}
