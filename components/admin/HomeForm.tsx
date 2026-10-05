"use client";

import { useActionState, useState } from "react";

import { saveHomeSettings, type FormState } from "@/app/admin/actions";
import { richPlainText } from "@/lib/rich-text";
import { HERO_LINE_MAX, type HomeContent } from "@/lib/types";

const INITIAL: FormState = {};

/** The description is one short paragraph beside the buttons. */
const DESCRIPTION_MAX = 220;

/**
 * The homepage hero: the two-line headline, the paragraph and button under
 * it, and the three channels along the bottom. The type treatment (the first
 * line quiet, the second loud, the orange disc behind them) belongs to the
 * design, so the fields here are plain text.
 */
export default function HomeForm({ home }: { home: HomeContent }) {
  const [state, action, pending] = useActionState(saveHomeSettings, INITIAL);
  const stored = richPlainText(home.heading)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const [quiet, setQuiet] = useState(stored[0] ?? "");
  const [loud, setLoud] = useState(stored.slice(1).join(" "));
  const [description, setDescription] = useState(richPlainText(home.description).replace(/\s*\n\s*/g, " "));

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Home Page</h1>
          <p className="ad-subtitle">
            The homepage, top to bottom. First the hero: the headline, the paragraph and button under it, and
            the three channels along the bottom. Then the text of each section below it. The lists inside those
            sections have their own screens: <strong>Trust &amp; Stats</strong>, <strong>Reviews</strong>,{" "}
            <strong>Services</strong>, <strong>Projects</strong> and <strong>Contact</strong>.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <form action={action} className="ad-panel">
        <div className="ad-grid">
          <div className="ad-fieldset">Headline</div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-heading-quiet">
              First line <span>(set light)</span>
            </label>
            <input
              id="home-heading-quiet"
              name="headingQuiet"
              type="text"
              value={quiet}
              onChange={(e) => setQuiet(e.target.value)}
              maxLength={HERO_LINE_MAX}
              placeholder="Design the Future."
              required
            />
            <p className="ad-hint">
              {quiet.length} / {HERO_LINE_MAX} characters. End it with a full stop: the headline is two short
              sentences.
            </p>
          </div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-heading-loud">
              Second line <span>(set bold)</span>
            </label>
            <input
              id="home-heading-loud"
              name="headingLoud"
              type="text"
              value={loud}
              onChange={(e) => setLoud(e.target.value)}
              maxLength={HERO_LINE_MAX}
              placeholder="Define the Experience."
              required
            />
            <p className="ad-hint">
              {loud.length} / {HERO_LINE_MAX} characters. Keep both lines about the same length; the type is
              very large, so every extra word makes it smaller on phones.
            </p>
          </div>

          <div className="ad-field ad-field--full">
            <span className="ad-label">How it reads</span>
            <div
              style={{
                padding: "22px 24px",
                borderRadius: 10,
                background: "#0d0b0a",
                color: "#f1ece6",
                fontSize: 30,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                overflowWrap: "anywhere",
              }}
            >
              <div style={{ fontWeight: 300 }}>{quiet || "First line"}</div>
              <div style={{ fontWeight: 700 }}>{loud || "Second line"}</div>
            </div>
          </div>

          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="home-description">
              Paragraph under the headline
            </label>
            <textarea
              id="home-description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              required
            />
            <p className="ad-hint">
              {description.length} / {DESCRIPTION_MAX} characters. One or two sentences on who you help and
              what you make for them.
            </p>
          </div>

          <div className="ad-fieldset">Button</div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-text">Button text</label>
            <input id="home-cta-text" name="ctaText" type="text" defaultValue={home.ctaText} maxLength={28} required />
            <p className="ad-hint">Two or three words, starting with a verb: “Book a Call”.</p>
          </div>
          <div className="ad-field">
            <label className="ad-label" htmlFor="home-cta-link">Button link</label>
            <input id="home-cta-link" name="ctaLink" type="text" defaultValue={home.ctaLink} placeholder="/contact?call=1" required />
            <p className="ad-hint">
              <code>/contact?call=1</code> opens the contact page with the Call or WhatsApp pop-up. Any site path
              or full URL works (other sites open in a new tab).
            </p>
          </div>

          <div className="ad-fieldset">Channel 01</div>
          <PanelFields prefix="it" title={home.itTitle} description={home.itDescription} link={home.itLink} />

          <div className="ad-fieldset">Channel 02</div>
          <PanelFields
            prefix="marketing"
            title={home.marketingTitle}
            description={home.marketingDescription}
            link={home.marketingLink}
          />

          <div className="ad-fieldset">Channel 03</div>
          <PanelFields prefix="media" title={home.mediaTitle} description={home.mediaDescription} link={home.mediaLink} />
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
        <input id={`home-${prefix}-title`} name={`${prefix}Title`} type="text" defaultValue={title} maxLength={28} required />
        <p className="ad-hint">Shown under its channel number at the bottom of the hero.</p>
      </div>
      <div className="ad-field">
        <label className="ad-label" htmlFor={`home-${prefix}-link`}>Link</label>
        <input id={`home-${prefix}-link`} name={`${prefix}Link`} type="text" defaultValue={link} placeholder="/services/…" />
        <p className="ad-hint">Usually the matching service page, e.g. /services/digital-marketing.</p>
      </div>
      <div className="ad-field ad-field--full">
        <label className="ad-label" htmlFor={`home-${prefix}-description`}>
          Description <span>(one sentence, shown under the name)</span>
        </label>
        <textarea
          id={`home-${prefix}-description`}
          name={`${prefix}Description`}
          rows={2}
          defaultValue={description}
          maxLength={140}
        />
      </div>
    </>
  );
}
