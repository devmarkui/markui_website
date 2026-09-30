"use client";

import "./contact.css";

import { useRef, useState, type FormEvent } from "react";

import { submitEnquiry } from "@/app/actions/enquiry";
import Chan from "@/components/site/Chan";
import ClosingCta from "@/components/site/ClosingCta";
import { cx } from "@/components/site/hooks";
import { Arrow } from "@/components/site/icons";
import Masthead from "@/components/site/Masthead";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import SitePage from "@/components/site/SitePage";
import { emailError, phoneError } from "@/lib/contact-validation";
import type { SocialLink } from "@/lib/types";

import Scope from "./Scope";

// ─── Content ─────────────────────────────────────────────────────────────────

const PROMISES = [
  "Free consultation",
  "Response within 24 hours",
  "Transparent pricing",
  "Dedicated project support",
  "Tailored solutions",
];

const SERVICES = [
  "Social Media Management",
  "Video Editing",
  "Content Creation",
  "Graphic Design",
  "Branding",
  "SEO",
  "Paid Advertising",
  "Website Development",
  "Photography & Videography",
  "Other",
];

const LINES: { label: string; value: string; href?: string }[] = [
  { label: "Email", value: "info@markui.lk", href: "mailto:info@markui.lk" },
  { label: "Phone", value: "+94 76 088 7702", href: "tel:+94760887702" },
  { label: "WhatsApp", value: "+94 76 088 7702", href: "https://wa.me/94760887702" },
  { label: "Studio", value: "Avissawella, Wellampitiya, Colombo, Sri Lanka" },
  { label: "Hours", value: "Mon – Fri · 9:00 AM – 5:00 PM" },
];

const FAQS = [
  {
    q: "How quickly do you respond to enquiries?",
    a: "We usually respond within 24 hours on business days. For urgent projects, reach out on WhatsApp for a faster reply.",
  },
  {
    q: "Do you work with international clients?",
    a: "Yes, we work with clients worldwide. Our team works remotely and collaborates easily across time zones.",
  },
  {
    q: "Can I request a custom package?",
    a: "Absolutely. Every project is different, so we tailor the work to your goals, budget and timeline. Just tell us what you need.",
  },
  {
    q: "Do you offer ongoing monthly services?",
    a: "Yes. We offer retainers for social media management, content creation, SEO and ongoing marketing support, for businesses that want steady, consistent growth.",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContactPage({
  socialLinks = [],
}: {
  /** Managed in the dashboard (Footer & Social) — the same list the footer shows. */
  socialLinks?: SocialLink[];
}) {
  return (
    <SitePage className="ct">
      <Masthead
        station="Contact"
        label="Get in touch"
        titleId="contact-title"
        quiet="Let's make"
        loud="something great"
        lede={
          <p>
            Ready to start your next project? Tell us where you are and where you want to be. A few lines is
            plenty, and we reply within 24 hours on business days.
          </p>
        }
      />

      <div className="ct-promises ground ground-signal" data-ground="signal">
        <div className="ct-promises-track">
          {[0, 1].map((copy) => (
            <ul className="ct-promises-list" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {PROMISES.map((promise) => (
                <li className="ct-promise" key={promise}>
                  {promise}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <Enquiry socialLinks={socialLinks} />

      <FAQ />

      <ClosingCta
        quiet="Prefer to"
        loud="talk"
        text="Book a call and we'll walk through your project together, or message us on WhatsApp for a faster reply."
        primary={{ href: "/proposal", label: "Book a call" }}
        secondary={{ href: "https://wa.me/94760887702", label: "WhatsApp us" }}
      />
    </SitePage>
  );
}

// ─── The form, the scope and the direct lines ────────────────────────────────

function Enquiry({ socialLinks }: { socialLinks: SocialLink[] }) {
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
        (found.includes("name") && form?.querySelector<HTMLElement>("#ct-name")) ||
        ((found.includes("contact") || emailError(email)) && form?.querySelector<HTMLElement>("#ct-email")) ||
        (phoneError(phone) && form?.querySelector<HTMLElement>("#ct-phone")) ||
        (found.includes("service") && form?.querySelector<HTMLElement>(".ct-chip"));
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
    <LiveSection className="ct-main ground ground-carbon" data-ground="carbon" aria-labelledby="ct-form-title">
      <div className="wrap ct-grid">
        <Scope pulse={pulse} ready={ready} sent={sent} />

        <div className="ct-lines-col">
          <Chan num="01">
            <span id="ct-form-title">The line is open</span>
          </Chan>
          <p className="ct-lede">
            Tell us about the project: what you&apos;re making, who it&apos;s for and when you need it. Or skip the
            form and reach us directly.
          </p>
          <ul className="ct-lines">
            {LINES.map((line) => (
              <li key={line.label}>
                <span className="ct-lines-label">{line.label}</span>
                {line.href ? (
                  <a
                    className="ct-lines-link"
                    href={line.href}
                    {...(line.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {line.value}
                  </a>
                ) : (
                  <span className="ct-lines-plain">{line.value}</span>
                )}
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
        </div>

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
              <div className={cx("ct-field", name.trim() && "is-ok", errors.includes("name") && "is-error")}>
                <label className="ct-label" htmlFor="ct-name">
                  <span className="ct-led" aria-hidden="true" />
                  <span className="ct-ch" aria-hidden="true">
                    01
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
                    02
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
                      03
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
                      04
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

              <fieldset className={cx("ct-field", service && "is-ok", errors.includes("service") && "is-error")}>
                <legend className="ct-label">
                  <span className="ct-led" aria-hidden="true" />
                  <span className="ct-ch" aria-hidden="true">
                    05
                  </span>
                  I&apos;m looking for help with <span className="ct-req">Required</span>
                </legend>
                <div className="ct-chips">
                  {SERVICES.map((option) => (
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

              <div className={cx("ct-field", message.trim() && "is-ok")}>
                <label className="ct-label" htmlFor="ct-message">
                  <span className="ct-led" aria-hidden="true" />
                  <span className="ct-ch" aria-hidden="true">
                    06
                  </span>
                  About the project <span className="ct-req">Optional</span>
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
      </div>
    </LiveSection>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQ() {
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
          {FAQS.map((faq, i) => {
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
