"use client";

import { useActionState, useState } from "react";

import { saveHomeSettings, type FormState } from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  BODY_SIZE_PRESETS,
  HEADING_SIZE_PRESETS,
  HERO_BODY_BASE,
  HERO_CTA_DEFAULTS,
  HERO_HEADING_BASE,
} from "@/components/sections/home/heroTypography";
import RichText from "@/components/ui/RichText";
import { BODY_LIMITS, HEADING_LIMITS, type RichDoc } from "@/lib/rich-text";
import { CTA_SIZE_RANGE, type HomeContent } from "@/lib/types";

const INITIAL: FormState = {};

export default function HomeForm({ home }: { home: HomeContent }) {
  const [state, action, pending] = useActionState(saveHomeSettings, INITIAL);
  // Mirrors of the hero fields, for the live preview.
  const [heading, setHeading] = useState<RichDoc>(home.heading);
  const [description, setDescription] = useState<RichDoc>(home.description);
  const [ctaText, setCtaText] = useState(home.ctaText);
  const [ctaSize, setCtaSize] = useState(home.ctaSize ? String(home.ctaSize) : "");
  const [ctaWeight, setCtaWeight] = useState(home.ctaWeight ? String(home.ctaWeight) : "");
  const [customColor, setCustomColor] = useState(Boolean(home.ctaColor));
  const [ctaColor, setCtaColor] = useState(home.ctaColor ?? HERO_CTA_DEFAULTS.color);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Home Page</h1>
          <p className="ad-subtitle">
            Edit the hero at the top of the Home page — the headline, the call
            to action and the three things listed under “What we do”.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <form action={action} className="ad-panel">
        <div className="ad-grid">
          <div className="ad-fieldset">Hero</div>
          <div className="ad-field ad-field--full">
            <RichTextEditor
              id="home-heading"
              name="heading"
              label="Hero heading"
              value={home.heading}
              limits={HEADING_LIMITS}
              baseStyle={HERO_HEADING_BASE}
              sizePresets={HEADING_SIZE_PRESETS}
              onChange={setHeading}
            />
          </div>
          <div className="ad-field ad-field--full">
            <RichTextEditor
              id="home-description"
              name="description"
              label="Hero description"
              value={home.description}
              limits={BODY_LIMITS}
              baseStyle={HERO_BODY_BASE}
              sizePresets={BODY_SIZE_PRESETS}
              onChange={setDescription}
            />
          </div>

          <div className="ad-fieldset">Call to action</div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-text">Button text</label>
            <input
              id="home-cta-text"
              name="ctaText"
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              required
            />
          </div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-link">Button link</label>
            <input id="home-cta-link" name="ctaLink" type="text" defaultValue={home.ctaLink} placeholder="/proposal" required />
            <p className="ad-hint">A site path such as /proposal, or a full URL (opens in a new tab).</p>
          </div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-size">
              Button text size <span>(px, {CTA_SIZE_RANGE.min}–{CTA_SIZE_RANGE.max}; blank for default)</span>
            </label>
            <input
              id="home-cta-size"
              name="ctaSize"
              type="number"
              min={CTA_SIZE_RANGE.min}
              max={CTA_SIZE_RANGE.max}
              step="0.5"
              placeholder={String(HERO_CTA_DEFAULTS.size)}
              value={ctaSize}
              onChange={(e) => setCtaSize(e.target.value)}
            />
          </div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-weight">Button text weight</label>
            <select
              id="home-cta-weight"
              name="ctaWeight"
              value={ctaWeight}
              onChange={(e) => setCtaWeight(e.target.value)}
            >
              <option value="">Default (bold)</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
            </select>
          </div>
          <div className="ad-field">
            <span className="ad-label">Button text colour</span>
            <label className="ad-check" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                name="ctaCustomColor"
                checked={customColor}
                onChange={(e) => setCustomColor(e.target.checked)}
              />
              Use a custom colour
            </label>
            {customColor ? (
              <input
                type="color"
                name="ctaColor"
                aria-label="Button text colour"
                value={ctaColor}
                onChange={(e) => setCtaColor(e.target.value)}
                style={{ marginTop: 8, width: 56, height: 34, padding: 2 }}
              />
            ) : null}
          </div>

          <div className="ad-field ad-field--full">
            <span className="ad-label">Live preview</span>
            <HeroPreview
              heading={heading}
              description={description}
              ctaText={ctaText}
              ctaStyle={{
                fontSize: `${Number(ctaSize) || HERO_CTA_DEFAULTS.size}px`,
                fontWeight: Number(ctaWeight) || HERO_CTA_DEFAULTS.weight,
                color: customColor ? ctaColor : HERO_CTA_DEFAULTS.color,
              }}
            />
            <p className="ad-hint">
              Shown at laptop size. On tablets and phones large text is scaled
              down so it always fits.
            </p>
          </div>

          <div className="ad-fieldset">What we do — 1. Digital Marketing</div>
          <PanelFields
            prefix="marketing"
            title={home.marketingTitle}
            description={home.marketingDescription}
            link={home.marketingLink}
          />

          <div className="ad-fieldset">What we do — 2. IT Solutions</div>
          <PanelFields
            prefix="it"
            title={home.itTitle}
            description={home.itDescription}
            link={home.itLink}
          />

          <div className="ad-fieldset">What we do — 3. Media Production</div>
          <PanelFields
            prefix="media"
            title={home.mediaTitle}
            description={home.mediaDescription}
            link={home.mediaLink}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save Home page"}
          </button>
        </div>
      </form>
    </>
  );
}

function PanelFields({
  prefix,
  title,
  description,
  link,
}: {
  prefix: "it" | "marketing" | "media";
  title: string;
  description: string;
  link: string;
}) {
  return (
    <>
      <div className="ad-field">
        <label className="ad-label" htmlFor={`home-${prefix}-title`}>Name</label>
        <input id={`home-${prefix}-title`} name={`${prefix}Title`} type="text" defaultValue={title} required />
        <p className="ad-hint">Shown next to its number in the hero list.</p>
      </div>
      <div className="ad-field">
        <label className="ad-label" htmlFor={`home-${prefix}-link`}>Link</label>
        <input id={`home-${prefix}-link`} name={`${prefix}Link`} type="text" defaultValue={link} placeholder="/services/…" />
        <p className="ad-hint">Where the list item goes when clicked.</p>
      </div>
      <div className="ad-field ad-field--full">
        <label className="ad-label" htmlFor={`home-${prefix}-description`}>
          Description <span>(shown when a visitor hovers this item)</span>
        </label>
        <textarea id={`home-${prefix}-description`} name={`${prefix}Description`} rows={2} defaultValue={description} />
      </div>
    </>
  );
}

/** The hero text column as it will look on the site, over the orange hero. */
function HeroPreview({
  heading,
  description,
  ctaText,
  ctaStyle,
}: {
  heading: RichDoc;
  description: RichDoc;
  ctaText: string;
  ctaStyle: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#ff6b00",
        borderRadius: 10,
        padding: "32px 28px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <div
          role="presentation"
          style={{ ...HERO_HEADING_BASE, marginBottom: 20, overflowWrap: "anywhere" }}
        >
          <RichText doc={heading} responsive={false} />
        </div>
        <p style={{ ...HERO_BODY_BASE, maxWidth: 440, marginBottom: 26 }}>
          <RichText doc={description} responsive={false} />
        </p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "#fff",
            padding: "15px 28px",
            borderRadius: 100,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            ...ctaStyle,
          }}
        >
          {ctaText || "Button"}
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#0a0a0a",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            ↗
          </span>
        </span>
      </div>
    </div>
  );
}
