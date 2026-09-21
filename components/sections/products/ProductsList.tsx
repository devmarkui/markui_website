"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LISTING_CSS } from "@/components/sections/shared/listing-styles";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { isExternalUrl, productPreview } from "@/lib/products";
import {
  PRODUCT_STATUS_LABELS,
  type Product,
  type ProductPreviewItem,
} from "@/lib/types";

/** Preview items shown per product. */
const MAX_PREVIEW = 6;

/**
 * The public /products page — the same editorial system as /services (white
 * page, full-width bands on the site grid), but about what Mark UI has built:
 * product details on the left, screenshots and demo videos on the right.
 *
 * Everything comes from the database; the admin controls the products, their
 * order and status, and each product's preview items.
 */
export default function ProductsList({ products }: { products: Product[] }) {
  return (
    <section className="sl" aria-labelledby="pl-heading">
      <div className="sl-wrap">
        <Reveal className="sl-header">
          <div>
            <span className="sl-eyebrow">What we build</span>
            <h1 className="sl-heading" id="pl-heading">
              Our<br />
              <em>Products</em>
            </h1>
          </div>
          <p className="sl-subtext">
            Digital products and software solutions designed to solve real
            business problems — built, maintained and supported by the Mark UI
            team.
          </p>
        </Reveal>
      </div>

      {products.length === 0 ? (
        <div className="sl-wrap">
          <Reveal className="sl-empty">
            <p>Our first products are on their way — please check back soon.</p>
          </Reveal>
        </div>
      ) : (
        <div className="sl-list">
          {products.map((product, index) => (
            <ProductRow key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      <div className="sl-wrap">
        <Reveal className="sl-cta">
          <div>
            <span className="sl-eyebrow">Start a project</span>
            <h2 className="sl-cta-heading">
              Ready to build<br />
              <em>something?</em>
            </h2>
          </div>
          <div className="sl-cta-side">
            <p className="sl-cta-text">
              Whether it&apos;s one of our products or something built around
              your business, tell us what you need and we&apos;ll take it from
              there.
            </p>
            <Link href="/contact" className="sl-btn sl-btn--solid">
              Contact us
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </div>

      <style>{LISTING_CSS}</style>
      <style>{`
        /* ── Products-only additions ── */
        .pl-top-left {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .pl-logo {
          position: relative;
          width: 28px; height: 28px;
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pl-logo img { object-fit: contain; }

        .pl-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin: -6px 0 22px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sl-txt-3);
        }
        .pl-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--sl-txt);
        }
        .pl-status::before {
          content: "";
          width: 7px; height: 7px;
          border-radius: 50%;
          border: 1.5px solid var(--sl-accent);
        }
        .pl-status[data-status="available"]::before { background: var(--sl-accent); }

        /* No detailed description: keep the list from crowding the intro. */
        .sl-short + .sl-label { margin-top: 20px; }

        .pl-tech {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 0 36px;
          padding: 0;
        }
        .pl-tech li {
          font-size: 12px;
          line-height: 1;
          color: var(--sl-txt-2);
          border: 1px solid var(--sl-border);
          border-radius: 2px;
          padding: 7px 10px;
        }

        /* Preview items are not links — the hover accent sits on the media. */
        .pl-item { cursor: default; }
        .pl-item[data-video="true"] { cursor: pointer; }
        .pl-video-btn {
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          background: none;
          color: inherit;
          font: inherit;
          text-align: inherit;
          cursor: pointer;
        }
        .pl-item:hover .sl-thumb img,
        .pl-item:hover .sl-thumb video { transform: scale(1.03); }
        .pl-item:hover .pl-caption { color: var(--sl-accent); }
        .pl-video-btn:focus-visible { outline: none; }
        .pl-video-btn:focus-visible .sl-thumb {
          outline: 2px solid var(--sl-accent);
          outline-offset: 2px;
        }
        /* Hairline edge so light screenshots don't bleed into the page. */
        .pl-item .sl-thumb::after {
          content: "";
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 0 1px var(--sl-line);
          pointer-events: none;
        }

        .pl-caption {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
          transition: color 0.2s ease;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          .pl-item:hover .sl-thumb img,
          .pl-item:hover .sl-thumb video { transform: none; }
        }
      `}</style>
    </section>
  );
}

// ─── One product ─────────────────────────────────────────────────────────────

function ProductRow({ product, index }: { product: Product; index: number }) {
  const headingId = `pl-product-${product.id}`;
  const shown = productPreview(product).slice(0, MAX_PREVIEW);
  const leadWide = shown.length % 2 === 1;
  const status = product.status ?? "available";
  const technologies = product.technologies ?? [];

  // A configured URL is explored; without one the button starts an enquiry.
  const href = product.link || "/contact";
  const external = Boolean(product.link && isExternalUrl(product.link));
  const label = product.ctaLabel || (product.link ? "Explore product" : "Enquire about it");

  return (
    <Reveal as="article" className="sl-row" aria-labelledby={headingId}>
      <div className="sl-row-inner">
        <div className="sl-info">
          <div className="sl-info-top">
            <span className="pl-top-left">
              <span className="sl-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              {product.logo ? (
                <span className="pl-logo" aria-hidden="true">
                  <Image src={product.logo} alt="" fill sizes="28px" />
                </span>
              ) : null}
            </span>
            {product.category ? (
              <p className="sl-tags">{product.category}</p>
            ) : null}
          </div>

          <h2 className="sl-name" id={headingId}>
            {product.name}
          </h2>

          <div className="pl-meta">
            <span className="pl-status" data-status={status}>
              {PRODUCT_STATUS_LABELS[status]}
            </span>
            {product.price ? <span>{product.price}</span> : null}
          </div>

          {product.shortDescription ? (
            <p className="sl-short">{product.shortDescription}</p>
          ) : null}
          {product.fullDescription &&
          product.fullDescription !== product.shortDescription ? (
            <p className="sl-full">{product.fullDescription}</p>
          ) : null}

          {product.features.length ? (
            <>
              <p className="sl-label">Key features</p>
              <ul className="sl-features">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          ) : null}

          {technologies.length ? (
            <>
              <p className="sl-label">Technologies</p>
              <ul className="pl-tech">
                {technologies.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </>
          ) : null}

          <Link
            href={href}
            className="sl-btn"
            aria-label={`${label}: ${product.name}${external ? " (opens in a new tab)" : ""}`}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {label}
            <span aria-hidden="true">{external ? "↗" : "→"}</span>
          </Link>
        </div>

        <div className="sl-work">
          <div className="sl-work-head">
            <p className="sl-label">Product preview</p>
            {shown.length ? (
              <span className="sl-work-count">
                {String(shown.length).padStart(2, "0")}
              </span>
            ) : null}
          </div>

          {shown.length ? (
            <div className="sl-work-grid">
              {shown.map((item, i) => (
                <PreviewItem
                  key={item.id}
                  item={item}
                  productName={product.name}
                  feature={leadWide && i === 0}
                  priority={index === 0 && i < 2}
                />
              ))}
            </div>
          ) : (
            <p className="sl-work-empty">Preview coming soon.</p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// ─── One screenshot or demo video ────────────────────────────────────────────

function PreviewItem({
  item,
  productName,
  feature,
  priority,
}: {
  item: ProductPreviewItem;
  productName: string;
  feature: boolean;
  priority: boolean;
}) {
  const video = item.type === "video" ? item.video : undefined;
  const { videoRef, playing, handlers } = useHoverVideo(Boolean(video), {
    touch: "tap",
  });
  const sizes = feature
    ? "(max-width: 960px) 100vw, 45vw"
    : "(max-width: 960px) 50vw, 22vw";
  const name = item.title || (video ? "Product demo" : "Screenshot");

  const thumb = (
    <div className="sl-thumb" data-playing={playing}>
      {video ? (
        <>
          <video
            ref={videoRef}
            // Without a poster, nudge past 0s so Safari paints a first frame.
            src={(item.image || video.includes("#")) ? video : `${video}#t=0.1`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
          />
          {item.image ? (
            <Image
              className="sl-poster"
              src={item.image}
              alt=""
              fill
              sizes={sizes}
              priority={priority}
            />
          ) : null}
          <span className="sl-thumb-kind">Video</span>
        </>
      ) : (
        <Image
          src={item.image}
          alt={`${productName} — ${name}`}
          fill
          sizes={sizes}
          priority={priority}
        />
      )}
    </div>
  );

  const caption = item.title ? <p className="pl-caption">{item.title}</p> : null;

  if (!video) {
    return (
      <figure className="sl-item pl-item" data-feature={feature} style={{ margin: 0 }}>
        {thumb}
        {caption}
      </figure>
    );
  }

  // Videos are buttons: hover plays with a mouse, tap/Enter toggles otherwise.
  return (
    <div className="sl-item pl-item" data-feature={feature} data-video="true">
      <button
        type="button"
        className="pl-video-btn"
        aria-label={`${playing ? "Pause" : "Play"} ${productName} — ${name} (muted)`}
        aria-pressed={playing}
        {...handlers}
      >
        {thumb}
      </button>
      {caption}
    </div>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────

/** Fades an element up into place the first time it scrolls into view. */
function Reveal({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: {
  as?: "div" | "article";
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`sl-reveal ${className}`}
      data-in={inView}
      {...rest}
    >
      {children}
    </Tag>
  );
}
