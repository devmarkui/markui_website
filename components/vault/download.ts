/** Which gallery a download comes from (app/api/vault/download). */
export interface DownloadTarget {
  project: string;
  gallery: string;
}

const FRAME = "vt-download-frame";

/**
 * Starts a download of `photos` ("all", or picture keys) without leaving the
 * page: a form posted into a hidden frame, so the browser's own download
 * manager shows the progress of a large zip.
 */
export function startDownload(target: DownloadTarget, photos: "all" | string[]) {
  let frame = document.querySelector<HTMLIFrameElement>(`iframe[name="${FRAME}"]`);
  if (!frame) {
    frame = document.createElement("iframe");
    frame.name = FRAME;
    frame.title = "Downloads";
    frame.hidden = true;
    document.body.append(frame);
  }
  const form = document.createElement("form");
  form.method = "post";
  form.action = "/api/vault/download";
  form.target = FRAME;
  form.hidden = true;
  const fields = { project: target.project, gallery: target.gallery, photos: photos === "all" ? "all" : photos.join(",") };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}
