import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { maxUploadBytes, storePoster, storeUpload, UploadError } from "@/lib/vault/files";
import { getVaultMedia, insertVaultMedia, setVaultMediaPoster } from "@/lib/vault/store";

/**
 * Uploads for the Vault's media library. The file is the raw request body
 * (named in `x-file-name`), streamed to disk, so a 500 MB video never sits in
 * memory. This route is outside /admin on purpose: the Proxy buffers every
 * request it matches, and Server Actions cap bodies at 25 MB.
 *
 *   POST /api/vault/upload                 → a new library item
 *   POST /api/vault/upload?poster=<id>     → the poster frame for video <id>
 */
export const maxDuration = 600;

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!(await getSession())) return fail("Your session has expired. Sign in again.", 401);
  // Forms can't set custom headers, and cross-site scripts can't without a
  // CORS preflight this route never answers: together a CSRF guard.
  if (request.headers.get("x-vault-upload") !== "1") return fail("Bad request.");
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Bad origin.", 403);
  if (!request.body) return fail("No file was sent.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxUploadBytes()) {
    return fail(`That file is larger than ${Math.round(maxUploadBytes() / 1024 / 1024)} MB.`, 413);
  }

  const posterFor = new URL(request.url).searchParams.get("poster");
  try {
    if (posterFor) {
      const media = await getVaultMedia(posterFor);
      if (!media || media.kind !== "video") return fail("That video is no longer in the library.", 404);
      const posterUrl = await storePoster(request.body, media.id);
      await setVaultMediaPoster(media.id, posterUrl);
      return Response.json({ media: { ...media, posterUrl } });
    }

    const name = decodeURIComponent(request.headers.get("x-file-name") ?? "").trim();
    if (!name) return fail("The file has no name.");
    const media = await insertVaultMedia(await storeUpload(request.body, name));
    revalidatePath("/admin/vault/media");
    return Response.json({ media });
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, 422);
    console.error("[vault] upload failed", error);
    return fail("The upload failed. Try again.", 500);
  }
}
