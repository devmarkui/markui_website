import fs from "node:fs/promises";
import path from "node:path";

import { CONTENT_TYPES } from "@/lib/media";
import { resolveUploadPath } from "@/lib/uploads";

/**
 * Serves media the admin uploaded from `.data/uploads`. Filenames are random
 * UUIDs, so a stored file never changes and can be cached aggressively.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/uploads/[...path]">,
) {
  const { path: segments } = await context.params;

  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type":
          CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
          "application/octet-stream",
        "Content-Length": String(file.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
