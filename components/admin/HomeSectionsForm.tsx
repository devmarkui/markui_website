"use client";

import { useActionState } from "react";

import { saveHomeSections, type FormState } from "@/app/admin/actions";
import TextField from "@/components/admin/Field";
import { LIMITS, type HomeSections } from "@/lib/site-content";

const INITIAL: FormState = {};

/**
 * The text of the homepage's sections under the hero, in the order they
 * appear on the page, and the title search engines show. The lists those
 * sections hold (services, projects, reviews, figures) have their own
 * screens; this is the writing around them.
 */
export default function HomeSectionsForm({ home }: { home: HomeSections }) {
  const [state, action, pending] = useActionState(saveHomeSections, INITIAL);

  return (
    <>
      <div className="ad-page-head" style={{ marginTop: 40 }}>
        <div>
          <h2 className="ad-title">Homepage sections</h2>
          <p className="ad-subtitle">
            The headings and text of each section under the hero, in page order. Each field shows how many
            characters it has room for: the layout was drawn for text of about that length.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <form action={action} className="ad-panel">
        <div className="ad-grid">
          <div className="ad-fieldset">Above the headline</div>
          <TextField
            id="hs-eyebrow"
            name="eyebrow"
            label="Line above the headline"
            max={LIMITS.eyebrow}
            defaultValue={home.eyebrow}
            hint="What the studio is, in three or four words. The location from Contact follows it."
            full
          />

          <div className="ad-fieldset">02 · Services</div>
          <TextField
            id="hs-services-intro"
            name="servicesIntro"
            label="Introduction"
            note="(beside “Seven disciplines. One team.”)"
            max={LIMITS.servicesIntro}
            rows={3}
            defaultValue={home.servicesIntro}
            hint="The heading counts your live services by itself; this is the paragraph next to it."
            full
          />

          <div className="ad-fieldset">03 · Selected work</div>
          <TextField
            id="hs-work-title"
            name="workTitle"
            label="Heading"
            max={LIMITS.workTitle}
            defaultValue={home.workTitle}
            hint="One short sentence. The line under it counts the projects on the wall by itself."
            full
          />

          <div className="ad-fieldset">05 · Why Mark UI</div>
          <TextField
            id="hs-why-title"
            name="whyTitle"
            label="Heading"
            max={LIMITS.whyTitle}
            defaultValue={home.whyTitle}
            hint="Stays on screen while the four reasons scroll past."
            full
          />
          {home.reasons.map((reason, i) => (
            <ReasonFields key={i} index={i} reason={reason} />
          ))}

          <div className="ad-fieldset">06 · Process</div>
          <TextField
            id="hs-process-kicker"
            name="processKicker"
            label="Heading, first part"
            note="(set small)"
            max={LIMITS.processKicker}
            defaultValue={home.processKicker}
          />
          <TextField
            id="hs-process-title"
            name="processTitle"
            label="Heading, second part"
            note="(set across the full width)"
            max={LIMITS.processTitle}
            defaultValue={home.processTitle}
            hint="Three or four short words: it is the largest type on the page."
          />
          {home.steps.map((step, i) => (
            <StepFields key={i} index={i} step={step} />
          ))}

          <div className="ad-fieldset">07 · Contact</div>
          <TextField
            id="hs-contact-title"
            name="contactTitle"
            label="Heading"
            max={LIMITS.contactTitle}
            defaultValue={home.contactTitle}
            hint="End it with a full stop: the stop is drawn as the orange signal dot."
          />
          <TextField
            id="hs-contact-lede"
            name="contactLede"
            label="Introduction"
            max={LIMITS.contactLede}
            rows={3}
            defaultValue={home.contactLede}
          />

          <div className="ad-fieldset">Search engines and browser tab</div>
          <TextField
            id="hs-seo-title"
            name="seoTitle"
            label="Page title"
            max={LIMITS.seoTitle}
            defaultValue={home.seoTitle}
            hint="Shown in the browser tab and as the blue link in search results. Start with “Mark UI”."
            full
          />
          <TextField
            id="hs-seo-description"
            name="seoDescription"
            label="Description"
            max={LIMITS.seoDescription}
            rows={3}
            defaultValue={home.seoDescription}
            hint="The two lines under the link in search results. Say what you do and where."
            full
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save homepage sections"}
          </button>
        </div>
      </form>
    </>
  );
}

function ReasonFields({ index, reason }: { index: number; reason: HomeSections["reasons"][number] }) {
  const n = index + 1;
  return (
    <>
      <TextField
        id={`hs-reason-label-${index}`}
        name="reasonLabel"
        label={`Reason ${n}: short name`}
        note="(on the knob’s readout)"
        max={LIMITS.reasonLabel}
        defaultValue={reason.label}
      />
      <TextField
        id={`hs-reason-title-${index}`}
        name="reasonTitle"
        label={`Reason ${n}: headline`}
        max={LIMITS.reasonTitle}
        defaultValue={reason.title}
        hint={index === 0 ? "A “+” on its own between words is drawn in orange, like the knob." : undefined}
      />
      <TextField
        id={`hs-reason-text-${index}`}
        name="reasonText"
        label={`Reason ${n}: text`}
        max={LIMITS.reasonText}
        rows={2}
        defaultValue={reason.text}
        full
      />
    </>
  );
}

function StepFields({ index, step }: { index: number; step: HomeSections["steps"][number] }) {
  const n = index + 1;
  return (
    <>
      <TextField
        id={`hs-step-name-${index}`}
        name="stepName"
        label={`Stage ${n}: name`}
        max={LIMITS.stepName}
        defaultValue={step.name}
        hint="One word."
      />
      <TextField
        id={`hs-step-text-${index}`}
        name="stepText"
        label={`Stage ${n}: text`}
        max={LIMITS.stepText}
        defaultValue={step.text}
        hint="One sentence."
      />
    </>
  );
}
