"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { getProject, getProjects, updateProject } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { cloneBlock } from "@/lib/vault/blocks";
import { captureScreenshot, checkFrameable, RemoteError } from "@/lib/vault/remote";
import { diskUsage, removeStoredFiles, storeUpload, UploadError } from "@/lib/vault/files";
import { vaultOrigin, vaultUrl } from "@/lib/vault/links";
import { previewToken } from "@/lib/vault/preview";
import { sanitizeProject, sanitizeSettings, httpsUrl, type ProjectFields } from "@/lib/vault/sanitize";
import {
  createVaultProject,
  deleteVaultMediaRow,
  deleteVaultProject,
  freeSlug,
  getVaultMedia,
  getVaultProject,
  insertVaultMedia,
  listVaultMedia,
  listVaultProjects,
  projectsUsing,
  reorderVaultProjects,
  saveVaultSettings,
  setVaultProjectFlags,
  updateVaultProject,
  VaultError,
} from "@/lib/vault/store";
import { albumsFor, prepareForSave, syncAlbum } from "@/lib/vault/sync";
import { templateFor } from "@/lib/vault/templates";
import {
  VAULT_STATUSES,
  type MediaRef,
  type VaultAlbum,
  type VaultMedia,
  type VaultProject,
  type VaultStatus,
} from "@/lib/vault/types";

/**
 * Every change to the Creative Vault made from the dashboard. Each action
 * checks the session first; the editor sends whole projects as JSON and
 * lib/vault/sanitize.ts re-checks all of it.
 */

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

function revalidateVault() {
  // The Vault's pages are cached; these paths are what creative.markui.lk
  // serves after the host rewrite (next.config.ts).
  revalidatePath("/vault");
  revalidatePath("/vault/[slug]", "page");
  revalidatePath("/vault/sitemap.xml");
  revalidatePath("/admin/vault");
  // markui.lk links into the Vault from projects, Top Work and services, and
  // only to pages that aren't drafts — so a publish or a new link refreshes them.
  revalidatePath("/projects/[slug]", "page");
  revalidatePath("/services");
  revalidatePath("/services/[slug]", "page");
}

/** A main-site project shows a "full project" link to its Vault page. */
function revalidateMainProjects() {
  revalidatePath("/projects/[slug]", "page");
  revalidatePath("/admin/projects");
}

function message(error: unknown, fallback: string) {
  if (error instanceof VaultError || error instanceof RemoteError || error instanceof UploadError) {
    return error.message;
  }
  console.error("[vault]", error);
  return fallback;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function createVaultProjectAction(input: {
  title: string;
  client?: string;
  serviceId?: string;
  template?: string;
  importFrom?: string;
}): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const source = input.importFrom ? await getProject(input.importFrom) : null;
  const template = templateFor(input.template);
  const title = (input.title || source?.title || "").trim();
  if (!title) return { error: "Give the project a title." };

  const cover: MediaRef | null = source
    ? source.coverType === "video" && source.coverVideo
      ? { url: source.coverVideo, kind: "video", poster: source.image || undefined }
      : source.image
        ? { url: source.image, kind: "image" }
        : null
    : null;

  const fields: ProjectFields = sanitizeProject({
    slug: await freeSlug(source?.slug ?? slugify(title)),
    title,
    client: input.client || source?.client || "",
    serviceId: input.serviceId || source?.serviceIds?.[0] || "",
    template: template.key,
    summary: source?.fullDescription || source?.description || "",
    date: source?.date ?? "",
    cover: cover ? { kind: cover.kind === "video" ? "video" : "image", media: cover } : null,
    links: source?.link ? [{ label: "Visit the website", url: source.link }] : [],
    facts: source?.industry ? [{ label: "Industry", value: source.industry }] : [],
    blocks: template.build(),
    status: "draft",
    featured: false,
  });

  try {
    const project = await createVaultProject(fields);
    if (source) {
      await updateProject(source.id, { vaultProjectId: project.id });
      revalidateMainProjects();
    }
    revalidateVault();
    return { ok: true, id: project.id };
  } catch (error) {
    return { error: message(error, "The project couldn't be created.") };
  }
}

export async function saveVaultProjectAction(
  id: string,
  payload: unknown,
): Promise<ActionResult & { project?: VaultProject; albums?: Record<string, VaultAlbum> }> {
  await requireAdmin();
  try {
    const previous = await getVaultProject(id);
    if (!previous) return { error: "That project no longer exists." };
    const fields = await prepareForSave(sanitizeProject(payload), previous);
    const project = await updateVaultProject(id, fields);
    revalidateVault();
    return { ok: true, project, albums: await albumsFor(project), message: "Saved." };
  } catch (error) {
    return { error: message(error, "The project couldn't be saved. Try again.") };
  }
}

export async function setVaultProjectStatusAction(id: string, status: VaultStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!VAULT_STATUSES.includes(status)) return { error: "Unknown status." };
  await setVaultProjectFlags(id, { status });
  revalidateVault();
  return { ok: true };
}

export async function deleteVaultProjectAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const project = await deleteVaultProject(id);
  if (!project) return { error: "That project no longer exists." };
  // Main-site projects that linked here fall back to their own portfolio link.
  const linked = (await getProjects({ includeInactive: true })).filter((p) => p.vaultProjectId === id);
  for (const p of linked) await updateProject(p.id, { vaultProjectId: undefined });
  if (linked.length) revalidateMainProjects();
  revalidateVault();
  return { ok: true, message: `"${project.title}" was deleted.` };
}

export async function duplicateVaultProjectAction(id: string): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const source = await getVaultProject(id);
  if (!source) return { error: "That project no longer exists." };
  try {
    const copy = await createVaultProject({
      ...source,
      slug: await freeSlug(`${source.slug}-copy`),
      title: `${source.title} (copy)`,
      blocks: source.blocks.map(cloneBlock),
      status: "draft",
      featured: false,
    });
    revalidateVault();
    return { ok: true, id: copy.id };
  } catch (error) {
    return { error: message(error, "The project couldn't be copied.") };
  }
}

export async function moveVaultProjectAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const projects = await listVaultProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return { error: "That project no longer exists." };
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= projects.length) return { ok: true };
  const ordered = [...projects];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await reorderVaultProjects(ordered.map((p) => p.id));
  revalidateVault();
  return { ok: true };
}

/** A link that opens a draft on the Vault host for a week. */
export async function previewUrlAction(id: string): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const project = await getVaultProject(id);
  if (!project) return { error: "That project no longer exists." };
  return { url: `${vaultUrl(vaultOrigin(), "preview")}/${project.id}?t=${previewToken(project.id)}` };
}

/** Points a main-site project at a Vault page (or at none). */
export async function linkMainProjectAction(
  vaultProjectId: string,
  mainProjectId: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  const projects = await getProjects({ includeInactive: true });
  for (const p of projects) {
    const wanted = p.id === mainProjectId;
    if (wanted && p.vaultProjectId !== vaultProjectId) await updateProject(p.id, { vaultProjectId });
    else if (!wanted && p.vaultProjectId === vaultProjectId) await updateProject(p.id, { vaultProjectId: undefined });
  }
  revalidateMainProjects();
  return { ok: true };
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export async function syncAlbumAction(url: string): Promise<{ album?: VaultAlbum; error?: string }> {
  await requireAdmin();
  const clean = httpsUrl(url);
  if (!clean) return { error: "Paste a Google Drive folder link or a Google Photos album link." };
  try {
    const album = await syncAlbum(clean);
    revalidateVault();
    return album.status === "error" ? { album, error: album.error } : { album };
  } catch (error) {
    return { error: message(error, "The album couldn't be read.") };
  }
}

export async function checkWebsiteAction(url: string): Promise<{ frameable?: boolean; error?: string }> {
  await requireAdmin();
  const clean = httpsUrl(url);
  if (!clean) return { error: "Enter the website's address, starting with https://." };
  try {
    return { frameable: await checkFrameable(clean, vaultOrigin()) };
  } catch {
    return { error: "The website didn't answer. Check the address." };
  }
}

export async function captureScreenshotAction(
  url: string,
  device: "desktop" | "mobile",
): Promise<{ media?: VaultMedia; error?: string }> {
  await requireAdmin();
  const clean = httpsUrl(url);
  if (!clean) return { error: "Enter the page's address, starting with https://." };
  try {
    const stream = await captureScreenshot(clean, device);
    const host = new URL(clean).hostname.replace(/^www\./, "");
    const media = await insertVaultMedia(await storeUpload(stream, `${host}-${device}.jpg`));
    revalidatePath("/admin/vault/media");
    return { media };
  } catch (error) {
    return { error: message(error, "The screenshot couldn't be taken.") };
  }
}

// ─── Media library ───────────────────────────────────────────────────────────

export async function listVaultMediaAction(): Promise<VaultMedia[]> {
  await requireAdmin();
  return listVaultMedia();
}

export async function deleteVaultMediaAction(
  id: string,
  force = false,
): Promise<ActionResult & { usedBy?: string[] }> {
  await requireAdmin();
  const media = await getVaultMedia(id);
  if (!media) return { ok: true };
  if (!force) {
    const usedBy = await projectsUsing(media.url);
    if (usedBy.length) {
      return { error: `Used in ${usedBy.map((t) => `"${t}"`).join(", ")}.`, usedBy };
    }
  }
  await deleteVaultMediaRow(id);
  await removeStoredFiles(media.url);
  revalidatePath("/admin/vault/media");
  revalidateVault();
  return { ok: true };
}

export async function diskUsageAction() {
  await requireAdmin();
  return diskUsage();
}

// ─── The Vault page's text ───────────────────────────────────────────────────

export async function saveVaultSettingsAction(payload: unknown): Promise<ActionResult> {
  await requireAdmin();
  await saveVaultSettings(sanitizeSettings(payload));
  revalidateVault();
  revalidatePath("/admin/vault/settings");
  return { ok: true, message: "Saved." };
}
