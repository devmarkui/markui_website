import path from "node:path";

import { CONTENT_TYPES } from "@/lib/media";
import { mediaResponse } from "@/lib/media-remote";
import { uploadMediaPath } from "@/lib/uploads";

/**
 * Serves media the admin uploaded: off local disk when the file is still
 * here, otherwise from the media server (media.markui.lk), with Range support
 * so video can seek. next/image reads its sources through here too, so the
 * optimiser works the same either way. Filenames are random UUIDs, so a
 * stored file never changes and can be cached aggressively.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/uploads/[...path]">,
) {
  const { path: segments } = await context.params;

  const rel = uploadMediaPath(segments);
  const type = rel ? CONTENT_TYPES[path.extname(rel).toLowerCase()] : undefined;
  if (!rel || !type) {
    return new Response("Not found", { status: 404 });
  }

  return mediaResponse(rel, request, {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
}
