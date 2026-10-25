import { mediaResponse } from "@/lib/media-remote";
import { contentTypeOf, vaultFilePath } from "@/lib/vault/files";

/**
 * Serves the Vault's uploads when nginx doesn't: in development, for files no
 * longer on this server's disk (nginx falls back to this route, which streams
 * them from media.markui.lk), and for next/image, which reads its sources
 * through the app. Range requests pass through, which Safari needs to play
 * and seek video.
 */
export async function GET(request: Request, context: RouteContext<"/media/vault/[name]">) {
  const { name } = await context.params;
  if (!vaultFilePath(name)) return new Response("Not found", { status: 404 });

  const type = contentTypeOf(name);
  const headers: Record<string, string> = {
    "Content-Type": type,
    // File names are random and never reused, so a stored file never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // An SVG opened on its own must not be able to run script on this origin.
  if (type === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

  return mediaResponse(`vault/${name}`, request, headers);
}
