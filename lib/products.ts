import type { Product, ProductPreviewItem } from "./types";

/**
 * What a product shows under "Product Preview", in display order.
 *
 * Products saved before the preview list existed only had a cover image and a
 * loose `media` list, so those stand in until the admin builds a preview.
 * Hidden items and items with nothing to show are dropped. Pure so it can run
 * on either side.
 */
export function productPreview(product: Product): ProductPreviewItem[] {
  if (product.preview?.length) {
    return product.preview.filter(
      (item) =>
        item.active &&
        (item.type === "video" ? Boolean(item.video) : Boolean(item.image)),
    );
  }

  const legacy: ProductPreviewItem[] = [];
  if (product.image) {
    legacy.push({
      id: `${product.id}-cover`,
      type: "image",
      title: "",
      image: product.image,
      active: true,
    });
  }
  for (const media of product.media) {
    legacy.push({
      id: `${product.id}-${media.url}`,
      type: media.type,
      title: "",
      image: media.type === "image" ? media.url : "",
      video: media.type === "video" ? media.url : undefined,
      active: true,
    });
  }
  return legacy;
}

/** True for links that leave the site, which open in a new tab. */
export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
