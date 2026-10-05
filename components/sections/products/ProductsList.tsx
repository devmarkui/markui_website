"use client";

import "./products.css";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import ClosingCta from "@/components/site/ClosingCta";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { isExternalUrl, productPreview } from "@/lib/products";
import { DEFAULT_CONTENT, type PageCopy } from "@/lib/site-content";
import { PRODUCT_STATUS_LABELS, type Product, type ProductPreviewItem } from "@/lib/types";

/** Preview items shown per product. */
const MAX_PREVIEW = 6;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The public /products page: what Mark UI has built, as spec sheets on the
 * bone ground — the product on the left, its screenshots and demo videos on
 * the right. On phones and tablets each sheet is a brief: the long
 * description, features and technologies fold behind "Features and
 * details", and the previews become one row you swipe (products.css).
 * Everything comes from the database; the admin controls the products,
 * their order and status, and each product's preview items.
 */
export default function ProductsList({
  products,
  copy = DEFAULT_CONTENT.pages.products,
}: {
  products: Product[];
  /** The page's header and closing text, managed in the dashboard (Page Text). */
  copy?: PageCopy;
}) {
  const available = products.filter((p) => (p.status ?? "available") === "available").length;
  const coming = products.length - available;

  return (
    <SitePage>
      <Masthead
        station="Products"
        label={copy.header.label}
        titleId="products-title"
        quiet={copy.header.quiet || undefined}
        loud={copy.header.loud}
        lede={<p>{copy.header.lede}</p>}
        readouts={
          products.length
            ? [
                { label: "Products", value: pad(products.length) },
                { label: "Available", value: pad(available) },
                ...(coming ? [{ label: "On the way", value: pad(coming) }] : []),
              ]
            : []
        }
      />

      <section className="pl-list ground ground-bone" data-ground="bone" aria-label="Our products">
        {products.length === 0 ? (
          <p className="wrap pl-none">Our first products are on their way. Please check back soon.</p>
        ) : (
          <div>
            {products.map((product, index) => (
              <ProductRow key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>

      <ClosingCta ground="signal" quiet={copy.cta.quiet} loud={copy.cta.loud} text={copy.cta.text} />
    </SitePage>
  );
}

// ─── One product ─────────────────────────────────────────────────────────────

function ProductRow({ product, index }: { product: Product; index: number }) {
  const headingId = `pl-product-${product.id}`;
  const shown = productPreview(product).slice(0, MAX_PREVIEW);
  const leadWide = shown.length % 2 === 1;
  const status = product.status ?? "available";
  const technologies = product.technologies ?? [];
  // Phones and tablets only: the details are folded until asked for.
  const [more, setMore] = useState(false);
  const moreId = `${headingId}-more`;
  const hasFull = Boolean(product.fullDescription && product.fullDescription !== product.shortDescription);
  const hasMore = hasFull || product.features.length > 0 || technologies.length > 0;

  // A configured URL is explored; without one the button starts an enquiry.
  const href = product.link || "/contact";
  const external = Boolean(product.link && isExternalUrl(product.link));
  const label = product.ctaLabel || (product.link ? "Explore product" : "Enquire about it");

  return (
    <LiveSection as="article" className="pl-row" aria-labelledby={headingId}>
      <div className="wrap pl-grid">
        <div className="pl-sheet">
          <p className="pl-top">
            <span className="pl-index">P–{pad(index + 1)}</span>
            <span className="pl-status" data-status={status}>
              {PRODUCT_STATUS_LABELS[status]}
            </span>
            {product.category ? <span>{product.category}</span> : null}
          </p>

          {product.logo ? (
            <span className="pl-logo" aria-hidden="true">
              <Image src={product.logo} alt="" fill sizes="40px" />
            </span>
          ) : null}

          <h2 className="pl-name" id={headingId}>
            {product.name}
          </h2>

          {product.price ? <p className="pl-price">{product.price}</p> : null}

          {product.shortDescription ? <p className="pl-short">{product.shortDescription}</p> : null}

          {hasMore ? (
            <>
              <button
                className="pl-more-toggle"
                type="button"
                aria-expanded={more}
                aria-controls={moreId}
                onClick={() => setMore((open) => !open)}
              >
                {more ? "Hide details" : "Features and details"}
                <span className="pl-more-icon" aria-hidden="true" />
              </button>

              <div className="pl-more" id={moreId} data-open={more ? "" : undefined}>
                {hasFull ? <p className="pl-full">{product.fullDescription}</p> : null}

                {product.features.length ? (
                  <div className="pl-block">
                    <p className="label">Key features</p>
                    <ul className="ticks">
                      {product.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {technologies.length ? (
                  <div className="pl-block">
                    <p className="label">Built with</p>
                    <ul className="chips">
                      {technologies.map((tech) => (
                        <li key={tech}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <Link
            href={href}
            className={product.link ? "btn-signal" : "btn-signal btn-ink"}
            aria-label={`${label}: ${product.name}${external ? " (opens in a new tab)" : ""}`}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {label} <Arrow />
          </Link>
        </div>

        <Reveal className="pl-preview">
          <div className="pl-preview-head">
            <p className="label">Product preview</p>
            {shown.length ? <span className="mono" style={{ color: "var(--ink-soft)" }}>{pad(shown.length)}</span> : null}
          </div>

          {shown.length ? (
            <div className="pl-preview-grid">
              {shown.map((item, i) => (
                <PreviewItem
                  key={item.id}
                  item={item}
                  number={i + 1}
                  productName={product.name}
                  feature={leadWide && i === 0}
                  eager={index === 0 && i < 2}
                />
              ))}
            </div>
          ) : (
            <p className="pl-empty-preview">Preview coming soon</p>
          )}
        </Reveal>
      </div>
    </LiveSection>
  );
}

// ─── One screenshot or demo video ────────────────────────────────────────────

function PreviewItem({
  item,
  number,
  productName,
  feature,
  eager,
}: {
  item: ProductPreviewItem;
  number: number;
  productName: string;
  feature: boolean;
  eager: boolean;
}) {
  const video = item.type === "video" ? item.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), { touch: "tap" });
  const sizes = feature ? "(max-width: 1099px) 100vw, 45vw" : "(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 22vw";
  const name = item.title || (video ? "Product demo" : "Screenshot");

  const print = (
    <Print
      image={item.image}
      video={video}
      alt={`${productName}: ${name}`}
      sizes={sizes}
      eager={eager}
      videoRef={videoRef}
      playing={playing}
      develop
      edge
    />
  );

  const caption = item.title ? (
    <p className="pl-caption">
      <b>{pad(number)}</b>
      {item.title}
    </p>
  ) : null;

  if (!video) {
    return (
      <figure className="pl-item" data-feature={feature}>
        {print}
        {caption}
      </figure>
    );
  }

  // Videos are buttons: hover plays with a mouse, tap/Enter toggles otherwise.
  return (
    <div className="pl-item" data-feature={feature}>
      <button
        type="button"
        className="pl-video"
        data-cursor={playing ? "Pause" : "Play"}
        aria-label={`${playing ? "Pause" : "Play"} ${productName}: ${name} (muted)`}
        aria-pressed={playing}
        {...handlers}
      >
        {print}
      </button>
      {caption}
    </div>
  );
}
