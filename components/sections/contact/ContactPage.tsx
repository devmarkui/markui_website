"use client";

import "./contact.css";

import { Suspense, useRef, useState, type FormEvent, type ReactNode } from "react";

import { submitEnquiry } from "@/app/actions/enquiry";
import Chan from "@/components/site/Chan";
import ClosingCta from "@/components/site/ClosingCta";
import { cx } from "@/components/site/hooks";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { BOOK_CALL_HREF, mailHref, phoneLines, telHref, whatsappHref, whatsappLines } from "@/lib/contact-details";
import { emailError, phoneError } from "@/lib/contact-validation";
import { DEFAULT_CONTENT, type ContactPageCopy, type Faq } from "@/lib/site-content";
import { DEFAULT_CONTACT, type ContactDetails, type SocialLink } from "@/lib/types";

import CallDialog from "./CallDialog";
import Scope from "./Scope";

// ─── Content ─────────────────────────────────────────────────────────────────

/** Asked when the dashboard has no live services to list. */
const FALLBACK_SERVICES = [
  "Digital Marketing",
  "Multimedia Production",
  "Graphic Designing",
  "Photography & Videography",
  "Web Design & Development",
  "Software & IT Solutions",
];

/** The direct lines, quickest first: phone, WhatsApp, then email. */
function directLines(contact: ContactDetails): { label: string; items: { text: string; href?: string }[] }[] {
  const whatsapp = whatsappLines(contact);
  return [
    { label: "Phone", items: phoneLines(contact).map((line) => ({ text: line.label, href: telHref(line) })) },
    ...(whatsapp.length
      ? [{ label: "WhatsApp", items: whatsapp.map((line) => ({ text: line.label, href: whatsappHref(line) })) }]
      : []),
    { label: "Email", items: [{ text: contact.email, href: mailHref(contact.email) }] },
    { label: "Studio", items: [{ text: contact.address }] },
    { label: "Hours", items: [{ text: contact.hours }] },
  ];
}

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContactPage({
  socialLinks = [],
  contact = DEFAULT_CONTACT,
  services = [],
  copy = DEFAULT_CONTENT.pages.contact,
}: {
  /** Managed in the dashboard (Footer & Social) — the same list the footer shows. */
  socialLinks?: SocialLink[];
  /** Managed in the dashboard (Contact Details). */
  contact?: ContactDetails;
  /** The live services' names (Services in the dashboard): what the form offers help with. */
  services?: string[];
  /** The header, promises, questions and closing text, managed in the dashboard (Contact). */
  copy?: ContactPageCopy;
}) {
  const whatsapp = whatsappLines(contact)[0];

  return (
    <SitePage className="ct">
      <Masthead
        station="Contact"
        label={copy.header.label}
        titleId="contact-title"
        quiet={copy.header.quiet || undefined}
        loud={copy.header.loud}
        lede={<p>{copy.header.lede}</p>}
      />

      <div className="ct-promises ground ground-signal" data-ground="signal">
        <div className="ct-promises-track">
          {/* Twice over, so the strip can loop; the second run is for the eye only. */}
          {[0, 1].map((run) => (
            <ul className="ct-promises-list" key={run} aria-hidden={run === 1 ? true : undefined}>
              {copy.promises.map((promise) => (
                <li className="ct-promise" key={promise}>
                  {promise}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <Enquiry socialLinks={socialLinks} contact={contact} services={services} />

      {copy.faqs.length ? <FAQ faqs={copy.faqs} /> : null}

      <ClosingCta
        quiet={copy.cta.quiet}
        loud={copy.cta.loud}
        text={copy.cta.text}
        primary={{ href: BOOK_CALL_HREF, label: "Book a call" }}
        secondary={whatsapp ? { href: whatsappHref(whatsapp), label: "WhatsApp us" } : null}
      />

      {/* Reads ?call from the URL, so it renders on the client. */}
      <Suspense fallback={null}>
        <CallDialog contact={contact} />
      </Suspense>
    </SitePage>
  );
}

// ─── The form, the scope and the direct lines ────────────────────────────────

/** One of the form's three steps; its LED lights once the step is answered. */
function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <div className={cx("ct-step", done && "is-done")}>
      <p className="ct-step-head">
        <span className="ct-step-led" aria-hidden="true" />
        <span className="ct-step-num">Step {n} of 3</span>
        <span className="chan-sep" aria-hidden="true" />
        <span>{title}</span>
      </p>
      {children}
    </div>
  );
}

function Enquiry({
  socialLinks,
  contact,
  services,
}: {
  socialLinks: SocialLink[];
  contact: ContactDetails;
  services: string[];
}) {
  const options = [...(services.length ? services : FALLBACK_SERVICES), "Other"];
  const lines = directLines(contact);
  const mainPhone = phoneLines(contact)[0];
  const mainWhatsapp = whatsappLines(contact)[0];
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  /** Hidden from people, tempting to bots — see submitEnquiry. */
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pulse, setPulse] = useState(0);
  /**
   * A field complains only once the visitor has finished with it, so a
   * half-typed address is not called wrong while they are still typing it.
   * After that it re-checks on every keystroke, so the message clears the
   * moment they fix it.
   */
  const [touched, setTouched] = useState<{ phone?: boolean; email?: boolean }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const phoneMsg = touched.phone ? phoneError(phone) : null;
  const emailMsg = touched.email ? emailError(email) : null;
  const emailOk = Boolean(email.trim()) && !emailError(email);
  const phoneOk = Boolean(phone.trim()) && !phoneError(phone);
  const ready = Boolean(name.trim()) && Boolean(service) && (emailOk || phoneOk) && !emailError(email) && !phoneError(phone);

  const clear = (key: string) => setErrors((list) => list.filter((e) => e !== key));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: string[] = [];
    if (!name.trim()) found.push("name");
    if (!phone.trim() && !email.trim()) found.push("contact");
    if (!service) found.push("service");
    setErrors(found);
    setSendError("");

    // Show any format problems even on fields never focused, e.g. a paste.
    setTouched({ phone: true, email: true });
    const badFormat = Boolean(phoneError(phone) || emailError(email));
    if (badFormat || found.length) {
      const form = formRef.current;
      const first =
        (found.includes("service") && form?.querySelector<HTMLElement>(".ct-chip")) ||
        (found.includes("name") && form?.querySelector<HTMLElement>("#ct-name")) ||
        ((found.includes("contact") || emailError(email)) && form?.querySelector<HTMLElement>("#ct-email")) ||
        (phoneError(phone) && form?.querySelector<HTMLElement>("#ct-phone"));
      if (first) first.focus();
      return;
    }

    setSending(true);
    const result = await submitEnquiry({
      source: "contact",
      name,
      email,
      phone,
      company,
      service,
      message,
      website: honeypot,
    });
    setSending(false);

    if (!result.ok) {
      setSendError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSent(true);
    setName("");
    setCompany("");
    setPhone("");
    setService("");
    setEmail("");
    setMessage("");
    setTouched({});
    window.setTimeout(() => successRef.current?.focus(), 60);
  }

  return (
    <LiveSection
      className="ct-main ground ground-carbon"
      id="enquiry"
      data-ground="carbon"
      aria-labelledby="ct-form-title"
    >
      <div className="wrap ct-grid">
        <Scope pulse={pulse} ready={ready} sent={sent} />

        {/* Says what the form is for before it asks for anything. */}
        <div className="sec-head ct-head">
          <Chan num="01">Start a project</Chan>
          <h2 className="sec-title" id="ct-form-title">
            <span className="q">Tell us</span> what you need<span className="stop">.</span>
          </h2>
          <p className="ct-lede">
            Three short steps: what you need, a little about it, and where to reply. We come back with ideas and
            a clear plan within 24 hours on business days.
          </p>
        </div>

        {/* Phones and tablets: the direct lines as three buttons, before the form. */}
        <nav className="ct-quick" aria-label="Reach us directly">
          {mainPhone ? (
            <a className="ct-quick-btn" href={telHref(mainPhone)} aria-label={`Call ${mainPhone.label}`}>
              Call <Arrow />
            </a>
          ) : null}
          {mainWhatsapp ? (
            <a
              className="ct-quick-btn"
              href={whatsappHref(mainWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${mainWhatsapp.label}`}
            >
              WhatsApp <Arrow />
            </a>
          ) : null}
          <a className="ct-quick-btn" href={mailHref(contact.email)} aria-label={`Email ${contact.email}`}>
            Email <Arrow />
          </a>
        </nav>

        <div className={cx("ct-panel", sending && "is-sending")}>
          {sent ? (
            <div className="ct-success" tabIndex={-1} ref={successRef}>
              <p className="ct-success-kicker">Message sent</p>
              <p className="ct-success-title">
                Signal received<span>.</span>
              </p>
              <p className="ct-success-text">
                Thanks for reaching out. We review every project and reply within 24 hours on business days.
              </p>
              <button className="btn-line" type="button" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form
              className="ct-form"
              ref={formRef}
              noValidate
              onSubmit={handleSubmit}
              onInput={() => setPulse((p) => p + 1)}
              aria-label="Project enquiry"
            >
              <Step n={1} title="What you need" done={Boolean(service)}>
                <fieldset className={cx("ct-field", service && "is-ok", errors.includes("service") && "is-error")}>
                  <legend className="ct-label">
                    <span className="ct-led" aria-hidden="true" />
                    <span className="ct-ch" aria-hidden="true">
                      01
                    </span>
                    I&apos;m looking for help with <span className="ct-req">Required</span>
                  </legend>
                  <div className="ct-chips">
                    {options.map((option) => (
                      <button
                        key={option}
                        className="ct-chip"
                        type="button"
                        aria-pressed={service === option}
                        aria-describedby={errors.includes("service") ? "ct-service-err" : undefined}
                        onClick={() => {
                          setService(option === service ? "" : option);
                          clear("service");
                          setPulse((p) => p + 1);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.includes("service") ? (
                    <p className="ct-error" id="ct-service-err">
                      Pick the one closest to what you need.
                    </p>
                  ) : null}
                </fieldset>
              </Step>

              <Step n={2} title="About the project" done={Boolean(message.trim())}>
                <div className={cx("ct-field", message.trim() && "is-ok")}>
                  <label className="ct-label" htmlFor="ct-message">
                    <span className="ct-led" aria-hidden="true" />
                    <span className="ct-ch" aria-hidden="true">
                      02
                    </span>
                    A few lines is plenty <span className="ct-req">Optional</span>
                  </label>
                  <textarea
                    className="ct-input ct-textarea"
                    id="ct-message"
                    name="message"
                    rows={4}
                    placeholder="What are you building, and what would a great result look like?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </Step>

              <Step n={3} title="Where we reply" done={Boolean(name.trim()) && (emailOk || phoneOk)}>
                <div className={cx("ct-field", name.trim() && "is-ok", errors.includes("name") && "is-error")}>
                  <label className="ct-label" htmlFor="ct-name">
                    <span className="ct-led" aria-hidden="true" />
                    <span className="ct-ch" aria-hidden="true">
                      03
                    </span>
                    Your name <span className="ct-req">Required</span>
                  </label>
                  <input
                    className="ct-input"
                    id="ct-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="First and last name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clear("name");
                    }}
                    aria-invalid={errors.includes("name") || undefined}
                    aria-describedby={errors.includes("name") ? "ct-name-err" : undefined}
                    required
                  />
                  {errors.includes("name") ? (
                    <p className="ct-error" id="ct-name-err">
                      Tell us your name so we know who we&apos;re talking to.
                    </p>
                  ) : null}
                </div>

                <div className={cx("ct-field", company.trim() && "is-ok")}>
                  <label className="ct-label" htmlFor="ct-company">
                    <span className="ct-led" aria-hidden="true" />
                    <span className="ct-ch" aria-hidden="true">
                      04
                    </span>
                    Company <span className="ct-req">Optional</span>
                  </label>
                  <input
                    className="ct-input"
                    id="ct-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Where you work"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div className={cx("ct-pair", errors.includes("contact") && "is-error")}>
                  <div className={cx("ct-field", emailOk && "is-ok", emailMsg && "is-error")}>
                    <label className="ct-label" htmlFor="ct-email">
                      <span className="ct-led" aria-hidden="true" />
                      <span className="ct-ch" aria-hidden="true">
                        05
                      </span>
                      Email
                    </label>
                    <input
                      className="ct-input"
                      id="ct-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="name@company.lk"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clear("contact");
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      aria-invalid={Boolean(emailMsg) || undefined}
                      aria-describedby={emailMsg ? "ct-reach-hint ct-email-err" : "ct-reach-hint"}
                    />
                    {emailMsg ? (
                      <p className="ct-error" id="ct-email-err" role="alert">
                        {emailMsg}
                      </p>
                    ) : null}
                  </div>
                  <div className={cx("ct-field", phoneOk && "is-ok", phoneMsg && "is-error")}>
                    <label className="ct-label" htmlFor="ct-phone">
                      <span className="ct-led" aria-hidden="true" />
                      <span className="ct-ch" aria-hidden="true">
                        06
                      </span>
                      Phone
                    </label>
                    <input
                      className="ct-input"
                      id="ct-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+94 7X XXX XXXX"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clear("contact");
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      aria-invalid={Boolean(phoneMsg) || undefined}
                      aria-describedby={phoneMsg ? "ct-reach-hint ct-phone-err" : "ct-reach-hint"}
                    />
                    {phoneMsg ? (
                      <p className="ct-error" id="ct-phone-err" role="alert">
                        {phoneMsg}
                      </p>
                    ) : null}
                  </div>
                  <p className="ct-hint" id="ct-reach-hint">
                    Email or phone: at least one, so we can reply.
                  </p>
                </div>
              </Step>

              {/* Hidden from people; a filled value marks the sender as a bot. */}
              <div className="ct-honeypot" aria-hidden="true">
                <label htmlFor="ct-website">Website</label>
                <input
                  id="ct-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="ct-actions">
                <button className="btn-signal ct-submit" type="submit" disabled={sending}>
                  <span>{sending ? "Sending" : "Send message"}</span>
                  <span className="ct-meter" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <Arrow />
                </button>
                <p className="ct-status" role="status" aria-live="polite">
                  {sendError}
                </p>
              </div>
            </form>
          )}
        </div>

        <aside className="ct-lines-col" aria-labelledby="ct-lines-title">
          <p className="label" id="ct-lines-title">
            Or talk to us now
          </p>
          <ul className="ct-lines">
            {lines.map((line) => (
              <li key={line.label}>
                <span className="ct-lines-label">{line.label}</span>
                <span className="ct-lines-values">
                  {line.items.map((item) =>
                    item.href ? (
                      <a
                        className="ct-lines-link"
                        key={item.href}
                        href={item.href}
                        {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span className="ct-lines-plain" key={item.text}>
                        {item.text}
                      </span>
                    ),
                  )}
                </span>
              </li>
            ))}
          </ul>
          {socialLinks.length ? (
            <nav aria-label="Social media">
              <p className="label">Follow the studio</p>
              <ul className="ct-social">
                {socialLinks.map((s) => (
                  <li key={`${s.label}-${s.url}`}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label} <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
    </LiveSection>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQ({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LiveSection className="ct-faq ground ground-bone" data-ground="bone" aria-labelledby="ct-faq-title">
      <div className="wrap">
        <div className="sec-head">
          <Chan num="02">Questions</Chan>
          <h2 className="sec-title" id="ct-faq-title">
            <span className="q">Frequently</span> asked.
          </h2>
          <p className="sec-lede">Still have questions? We&apos;re happy to answer anything before you reach out.</p>
        </div>
        <ul className="ct-faq-list">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal as="li" className="ct-faq-item" key={faq.q} data-open={isOpen ? "" : undefined} delay={i}>
                <h3>
                  <button
                    className="ct-faq-q"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`ct-faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="ct-faq-num">{pad(i + 1)}</span>
                    <span className="ct-faq-text">{faq.q}</span>
                    <span className="ct-faq-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="ct-faq-a" id={`ct-faq-${i}`} role="region" aria-label={faq.q}>
                  <div>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </LiveSection>
  );
}
