"use client";

import "./products.css";

import Image from "next/image";
import Link from "next/link";

import ClosingCta from "@/components/site/ClosingCta";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import Print from "@/components/site/Print";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { useHoverVideo } from "@/hooks/useHoverVideo";
import { isExternalUrl, productPreview } from "@/lib/products";
import { PRODUCT_STATUS_LABELS, type Product, type ProductPreviewItem } from "@/lib/types";

/** Preview items shown per product. */
const MAX_PREVIEW = 6;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The public /products page: what Mark UI has built, as spec sheets on the
 * bone ground — the product on the left, its screenshots and demo videos on
 * the right. Everything comes from the database; the admin controls the
 * products, their order and status, and each product's preview items.
 */
export default function ProductsList({ products }: { products: Product[] }) {
  const available = products.filter((p) => (p.status ?? "available") === "available").length;
  const coming = products.length - available;

  return (
    <SitePage>
      <Masthead
        station="Products"
        label="What we build"
        titleId="products-title"
        quiet="Software we"
        loud="build and run"
        lede={
          <p>
            Digital products and software solutions designed to solve real business problems, built, maintained
            and supported by the Mark UI team.
          </p>
        }
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

      <ClosingCta
        ground="signal"
        quiet="Ready to build"
        loud="something"
        text="Whether it's one of our products or something built around your business, tell us what you need and we'll take it from there."
      />
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
          {product.fullDescription && product.fullDescription !== product.shortDescription ? (
            <p className="pl-full">{product.fullDescription}</p>
          ) : null}

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
