"use client";

import { useActionState, useState } from "react";

import { savePageText, type FormState } from "@/app/admin/actions";
import TextField from "@/components/admin/Field";
import { LIMITS, type PageCopy, type SiteContent } from "@/lib/site-content";

const INITIAL: FormState = {};

/**
 * The header and closing text of the Projects, Products and Services pages,
 * and the footer note. (The About page has its own screen, and the Contact
 * page's text is on the Contact screen.)
 */
export default function PageTextForm({ content }: { content: SiteContent }) {
  const [state, action, pending] = useActionState(savePageText, INITIAL);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Page Text</h1>
          <p className="ad-subtitle">
            What each page opens and closes with: the label, the two-part title and the introduction at the
            top, and the closing line above the footer. The About page and the Contact page have their own
            screens.
          </p>
        </div>
      </div>

      {state.error ? <div className="ad-alert ad-alert--error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="ad-alert ad-alert--ok" role="status">{state.message}</div> : null}

      <div className="ad-alert ad-alert--note" role="note">
        <strong>Titles come in two parts.</strong> The first is set light and the second bold, and the site adds
        the orange full stop: &ldquo;Work we&rsquo;ve&rdquo; + &ldquo;put our name on&rdquo; reads as{" "}
        <em>Work we&rsquo;ve <strong>put our name on.</strong></em> Keep each part to two or three words.
      </div>

      <form action={action}>
        <PageFields id="projects" name="Projects" path="/projects" copy={content.pages.projects} />
        <PageFields id="products" name="Products" path="/products" copy={content.pages.products} />
        <PageFields id="services" name="Services" path="/services" copy={content.pages.services} />

        <div className="ad-panel">
          <h2 className="ad-panel-title">Footer</h2>
          <div className="ad-grid">
            <TextField
              id="pt-footer-note"
              name="footerNote"
              label="Note under the logo"
              max={LIMITS.footerNote}
              rows={2}
              defaultValue={content.footerNote}
              hint="One or two sentences on what the studio does. Shown in the footer of every page."
              full
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
            {pending ? "Saving…" : "Save page text"}
          </button>
        </div>
      </form>
    </>
  );
}

/** One page's header and closing fields; the field names are `<id>Label`, `<id>Quiet`, … */
export function PageFields({
  id,
  name,
  path,
  copy,
}: {
  id: string;
  name: string;
  path: string;
  copy: PageCopy;
}) {
  const [quiet, setQuiet] = useState(copy.header.quiet);
  const [loud, setLoud] = useState(copy.header.loud);

  return (
    <div className="ad-panel">
      <h2 className="ad-panel-title">
        {name} <span style={{ fontWeight: 400, opacity: 0.6 }}>{path}</span>
      </h2>
      <div className="ad-grid">
        <div className="ad-fieldset">Top of the page</div>
        <TextField
          id={`pt-${id}-label`}
          name={`${id}Label`}
          label="Label"
          note="(small, above the title)"
          max={LIMITS.headerLabel}
          defaultValue={copy.header.label}
          full
        />
        <TextField
          id={`pt-${id}-quiet`}
          name={`${id}Quiet`}
          label="Title, first part"
          note="(set light)"
          max={LIMITS.headerQuiet}
          value={quiet}
          onChange={setQuiet}
          required={false}
        />
        <TextField
          id={`pt-${id}-loud`}
          name={`${id}Loud`}
          label="Title, second part"
          note="(set bold; no full stop)"
          max={LIMITS.headerLoud}
          value={loud}
          onChange={setLoud}
        />
        <div className="ad-field ad-field--full">
          <span className="ad-label">How the title reads</span>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 10,
              background: "#0d0b0a",
              color: "#f1ece6",
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              overflowWrap: "anywhere",
            }}
          >
            <span style={{ fontWeight: 300, color: "#a39a92" }}>{quiet}</span>{" "}
            <span style={{ fontWeight: 700 }}>{loud.replace(/\.$/, "")}</span>
            <span style={{ fontWeight: 700, color: "#ff6b00" }}>.</span>
          </div>
        </div>
        <TextField
          id={`pt-${id}-lede`}
          name={`${id}Lede`}
          label="Introduction"
          max={LIMITS.headerLede}
          rows={3}
          defaultValue={copy.header.lede}
          hint="Two sentences: what is on the page and how to use it."
          full
        />

        <div className="ad-fieldset">Bottom of the page</div>
        <TextField
          id={`pt-${id}-cta-quiet`}
          name={`${id}CtaQuiet`}
          label="Closing line, first part"
          note="(set light)"
          max={LIMITS.ctaQuiet}
          defaultValue={copy.cta.quiet}
          required={false}
        />
        <TextField
          id={`pt-${id}-cta-loud`}
          name={`${id}CtaLoud`}
          label="Closing line, second part"
          note="(set bold; no full stop)"
          max={LIMITS.ctaLoud}
          defaultValue={copy.cta.loud}
        />
        <TextField
          id={`pt-${id}-cta-text`}
          name={`${id}CtaText`}
          label="Closing text"
          max={LIMITS.ctaText}
          rows={2}
          defaultValue={copy.cta.text}
          hint="One or two sentences asking the visitor to get in touch. The buttons are added for you."
          full
        />
      </div>
    </div>
  );
}
