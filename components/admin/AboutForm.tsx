"use client";

import { useActionState } from "react";

import { saveAboutSettings, type FormState } from "@/app/admin/actions";
import type { AboutContent, AboutItem } from "@/lib/types";

const INITIAL: FormState = {};
const itemLines = (items: AboutItem[]) =>
  items.map((item) => `${item.title} | ${item.description}`).join("\n");

export default function AboutForm({ about }: { about: AboutContent }) {
  const [state, action, pending] = useActionState(saveAboutSettings, INITIAL);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">About Page</h1>
          <p className="ad-subtitle">
            Edit the core story, process, expertise, values and closing call to
            action. Projects and services are managed in their own sections and
            appear on the page automatically.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <form action={action} className="ad-panel">
        <div className="ad-grid">
          <div className="ad-fieldset">Hero</div>
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="about-hero">Hero heading</label>
            <textarea id="about-hero" name="heroHeading" rows={4} defaultValue={about.heroHeading} required />
            <p className="ad-hint">Use a new line where the large heading should break.</p>
          </div>
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="about-intro">Introduction</label>
            <textarea id="about-intro" name="introduction" rows={3} defaultValue={about.introduction} required />
          </div>

          <div className="ad-fieldset">Who we are</div>
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="about-who">Company description</label>
            <textarea id="about-who" name="whoWeAre" rows={9} defaultValue={about.whoWeAre} required />
            <p className="ad-hint">Leave a blank line between paragraphs.</p>
          </div>

          <div className="ad-fieldset">Structured sections</div>
          <ListField id="about-approach" name="approach" label="How we work" value={itemLines(about.approach)} />
          <ListField id="about-reasons" name="reasons" label="Why Mark UI" value={itemLines(about.reasons)} />
          <ListField id="about-values" name="values" label="Our values" value={itemLines(about.values)} />

          <div className="ad-fieldset">Call to action</div>
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="about-cta-heading">Heading</label>
            <input id="about-cta-heading" name="ctaHeading" type="text" defaultValue={about.ctaHeading} required />
          </div>
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="about-cta-text">Supporting text</label>
            <textarea id="about-cta-text" name="ctaText" rows={3} defaultValue={about.ctaText} required />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save About page"}
          </button>
        </div>
      </form>
    </>
  );
}

function ListField({
  id,
  name,
  label,
  value,
  hint = "One item per line: Title | Description",
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="ad-field ad-field--full">
      <label className="ad-label" htmlFor={id}>{label}</label>
      <textarea id={id} name={name} rows={6} defaultValue={value} required />
      <p className="ad-hint">{hint}</p>
    </div>
  );
}
