"use client";

import type { VaultMedia } from "@/lib/vault/types";

/**
 * Sends one file to /api/vault/upload as the raw request body, reporting
 * progress. Videos then get a poster frame, grabbed from the local file in
 * this browser so the server never has to decode video.
 */
export function uploadFile(file: File, onProgress?: (fraction: number) => void): Promise<VaultMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/vault/upload");
    xhr.setRequestHeader("x-vault-upload", "1");
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new Error(`"${file.name}" couldn't be sent. Check your connection.`));
    xhr.onload = async () => {
      let body: { media?: VaultMedia; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // A proxy error page rather than JSON.
      }
      if (xhr.status >= 400 || !body.media) {
        reject(
          new Error(
            body.error ??
              (xhr.status === 413 ? `"${file.name}" is too large for the server.` : `"${file.name}" couldn't be uploaded.`),
          ),
        );
        return;
      }
      let media = body.media;
      if (media.kind === "video") media = await attachPoster(file, media).catch(() => media);
      resolve(media);
    };
    xhr.send(file);
  });
}

/** Draws a frame about a second in (or 10% for short clips) and uploads it. */
async function attachPoster(file: File, media: VaultMedia): Promise<VaultMedia> {
  const blob = await grabFrame(file);
  if (!blob) return media;
  const res = await fetch(`/api/vault/upload?poster=${encodeURIComponent(media.id)}`, {
    method: "POST",
    headers: { "x-vault-upload": "1", "content-type": "image/jpeg" },
    body: blob,
  });
  const body = (await res.json().catch(() => ({}))) as { media?: VaultMedia };
  return body.media ?? media;
}

function grabFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    const done = (blob: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    const timer = setTimeout(() => done(null), 15000);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 10) * 0.1);
    };
    video.onseeked = () => {
      clearTimeout(timer);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight, 1));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => done(blob), "image/jpeg", 0.86);
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
  });
}
