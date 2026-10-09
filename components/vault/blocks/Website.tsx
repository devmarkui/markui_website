"use client";

import { useEffect, useRef, useState } from "react";

import { Arrow } from "@/components/site/icons";
import { refPicture } from "@/lib/vault/media-urls";
import type { Device, WebsiteBlock } from "@/lib/vault/types";

const NATIVE: Record<Device, { width: number; ratio: number; label: string }> = {
  desktop: { width: 1440, ratio: 1440 / 900, label: "Desktop" },
  tablet: { width: 834, ratio: 834 / 1112, label: "Tablet" },
  mobile: { width: 390, ratio: 390 / 844, label: "Phone" },
};

function resolve(base: string, url: string) {
  try {
    return new URL(url || "/", base).toString();
  } catch {
    return base;
  }
}

/**
 * The website itself, in a desktop browser, a tablet or a phone, page by
 * page. When the site allows framing it is live: the real site at its real
 * width, scaled to fit, and one click lets you use it. Otherwise (or when
 * chosen) a full-page screenshot scrolls inside the frame.
 */
export default function Website({ block }: { block: WebsiteBlock }) {
  const devices = block.devices.length ? block.devices : (["desktop"] as Device[]);
  const pages = block.pages.length ? block.pages : [{ id: "home", label: "Home", url: "/", desktop: null, mobile: null }];
  const [device, setDevice] = useState<Device>(devices[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [preferShot, setPreferShot] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const href = resolve(block.url, page.url);
  const shotRef = device === "mobile" ? (page.mobile ?? page.desktop) : (page.desktop ?? page.mobile);
  const shot = shotRef ? refPicture(shotRef, `${page.id}-${device}`) : null;
  const liveAllowed = block.mode === "live" || (block.mode === "auto" && block.frameable === true);
  const live = liveAllowed && !(preferShot && shot);
  const native = NATIVE[device];
  const scale = width ? width / native.width : 0;

  useEffect(() => {
    const node = screenRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [device]);

  // A screenshot glides down while the pointer rests on it.
  const glide = useRef<number>(0);
  const startGlide = () => {
    const node = scrollRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const step = () => {
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 1) return;
      node.scrollTop += 1.6;
      glide.current = requestAnimationFrame(step);
    };
    glide.current = requestAnimationFrame(step);
  };
  const stopGlide = () => cancelAnimationFrame(glide.current);

  if (!block.url) return null;
  const host = new URL(block.url).hostname.replace(/^www\./, "");

  return (
    <div className="vt-site">
      <div className="vt-site-controls">
        {pages.length > 1 ? (
          <div className="vt-site-pages" role="tablist" aria-label="Pages">
            {pages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === pageIndex}
                className="vt-site-tab"
                onClick={() => {
                  // A new page starts with the scroll wheel back on the page.
                  setPageIndex(i);
                  setEngaged(false);
                }}
              >
                {p.label || `Page ${i + 1}`}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="vt-site-devices" role="radiogroup" aria-label="Device">
          {devices.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={d === device}
              className="vt-site-device"
              data-device={d}
              onClick={() => {
                setDevice(d);
                setEngaged(false);
              }}
            >
              <span className="vt-site-device-icon" aria-hidden="true" />
              {NATIVE[d].label}
            </button>
          ))}
        </div>
      </div>

      <div className="vt-site-stage" data-device={device}>
        <div className="vt-site-frame" data-device={device}>
          {device === "desktop" ? (
            <div className="vt-site-chrome">
              <span className="vt-site-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="vt-site-url">
                <span className="vt-site-lock" aria-hidden="true" />
                {host}
                <span className="vt-site-path">{new URL(href).pathname === "/" ? "" : new URL(href).pathname}</span>
              </span>
            </div>
          ) : null}
          <div ref={screenRef} className="vt-site-screen" style={{ aspectRatio: `${native.ratio}` }}>
            {live && scale ? (
              <>
                <iframe
                  key={`${href}-${device}`}
                  src={href}
                  title={`${host} on ${NATIVE[device].label.toLowerCase()}`}
                  loading="lazy"
                  className="vt-site-live"
                  data-cursor-native=""
                  style={{
                    width: native.width,
                    height: native.width / native.ratio,
                    transform: `scale(${scale})`,
                    pointerEvents: engaged ? "auto" : "none",
                  }}
                />
                {!engaged ? (
                  <button type="button" className="vt-site-engage" onClick={() => setEngaged(true)} data-cursor="Explore">
                    <span className="vt-site-engage-pill">Click to explore the live site</span>
                  </button>
                ) : null}
              </>
            ) : shot ? (
              <div
                ref={scrollRef}
                className="vt-site-shot"
                tabIndex={0}
                aria-label={`Screenshot of ${host}${page.label ? `, ${page.label}` : ""}. Scroll to see the whole page.`}
                onPointerEnter={startGlide}
                onPointerLeave={stopGlide}
                onWheel={stopGlide}
                onTouchStart={stopGlide}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.src} srcSet={shot.srcSet} sizes="(min-width: 1100px) 1100px, 92vw" alt="" loading="lazy" decoding="async" />
              </div>
            ) : (
              <a className="vt-site-empty" href={href} target="_blank" rel="noopener noreferrer">
                <span className="mono">{host}</span>
                <span>Open the live site ↗</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="vt-site-foot">
        <a className="btn-signal" href={href} target="_blank" rel="noopener noreferrer">
          Open {host} <Arrow />
        </a>
        {liveAllowed && shot ? (
          <button type="button" className="btn-line" onClick={() => setPreferShot((v) => !v)}>
            {live ? "Show the screenshot" : "Show the live site"}
          </button>
        ) : null}
        {live && engaged ? (
          <button type="button" className="btn-line" onClick={() => setEngaged(false)}>
            Done exploring
          </button>
        ) : null}
        <span className="mono vt-site-hint">
          {live ? "Live site · scaled to fit" : shot ? "Full-page screenshot · scroll inside" : ""}
        </span>
      </div>
    </div>
  );
}
