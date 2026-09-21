import type { GalleryItem, Project } from "./types";

/** What a project card shows: its cover still, or a video with that still as poster. */
export interface ProjectCover {
  type: "image" | "video";
  image: string;
  video?: string;
}

/**
 * The project's cover, or `null` when there is nothing to show — such projects
 * are left off the public Projects page rather than drawn as blank tiles.
 */
export function projectCover(project: Project): ProjectCover | null {
  if (project.coverType === "video" && project.coverVideo) {
    return { type: "video", image: project.image, video: project.coverVideo };
  }
  if (project.image) return { type: "image", image: project.image };
  return null;
}

/**
 * The detail page gallery, in display order. Projects saved before the gallery
 * existed only had a loose `media` list, which stands in until the admin builds
 * a gallery. Hidden items and items with nothing to show are dropped.
 */
export function projectGallery(project: Project): GalleryItem[] {
  if (project.gallery?.length) {
    return project.gallery.filter(
      (item) =>
        item.active &&
        (item.type === "video" ? Boolean(item.video) : Boolean(item.image)),
    );
  }
  return project.media.map((media) => ({
    id: `${project.id}-${media.url}`,
    type: media.type,
    title: "",
    image: media.type === "image" ? media.url : "",
    video: media.type === "video" ? media.url : undefined,
    active: true,
  }));
}

/** Year label from the optional ISO date, e.g. "2025". */
export function projectYear(project: Project) {
  return project.date ? project.date.slice(0, 4) : "";
}
