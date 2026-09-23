'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { submitEnquiry } from '@/app/actions/enquiry'
import { emailError, phoneError } from '@/lib/contact-validation'
import type { SocialLink } from '@/lib/types'

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const PROMISES = [
  'Free Consultation',
  'Response Within 24hrs',
  'Transparent Pricing',
  'Dedicated Project Support',
  'Tailored Solutions',
]

const CYCLE_WORDS = ['experiences.', 'new projects.', 'collaborations.']

const SERVICES = [
  'Social Media Management',
  'Video Editing',
  'Content Creation',
  'Graphic Design',
  'Branding',
  'SEO',
  'Paid Advertising',
  'Website Development',
  'Photography & Videography',
  'Other',
]

const SERVICE_CATEGORIES = [
  {
    num: '01',
    title: 'Digital Marketing',
    description:
      'We build marketing systems that connect every channel — search, social, email, and paid media — into one engine that attracts the right audience and turns them into paying clients.',
    tags: ['Social Media', 'SEO', 'Google & Meta Ads', 'Email Marketing', 'Content Strategy', 'Analytics'],
  },
  {
    num: '02',
    title: 'Creative Production',
    description:
      'From concept to final cut, we produce scroll-stopping visuals and videos that communicate your brand story with clarity, energy, and purpose.',
    tags: ['Video Editing', 'Photography', 'Videography', 'Content Creation', 'Motion Graphics', 'Reels & Shorts'],
  },
  {
    num: '03',
    title: 'Brand & Design',
    description:
      'We craft visual identities that make a lasting first impression — from logos and colour systems to complete brand guidelines that scale across every platform.',
    tags: ['Graphic Design', 'Branding', 'Logo Design', 'Visual Identity', 'Brand Guidelines', 'Print & Packaging'],
  },
  {
    num: '04',
    title: 'Web & Technology',
    description:
      'We design and build fast, conversion-focused websites and digital experiences that look great, rank well, and turn visitors into customers.',
    tags: ['Website Development', 'Landing Pages', 'E-Commerce', 'UI/UX Design', 'Performance Optimisation', 'CMS & Integrations'],
  },
]

const INFO_ITEMS = [
  {
    label: 'Email',
    value: 'info@markui.lk',
    href: 'mailto:info@markui.lk',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+94 76 088 7702',
    href: 'tel:+94760887702',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.57 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6 6l.92-1.17a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.78 16z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    value: '+94 76 088 7702',
    href: 'https://wa.me/94760887702',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: 'Location',
    value: 'Avissawella, Wellampitiya, Colombo, Sri Lanka',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'Working Hours',
    value: 'Mon – Fri · 9:00 AM – 5:00 PM',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

/**
 * Icons for the social row, looked up by the label the admin gave the link
 * (Footer & Social in the dashboard). Anything unrecognised falls back to
 * GENERIC_SOCIAL_ICON, so a new platform still gets a usable button.
 */
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  linkedin: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  tiktok: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
  youtube: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  ),
  x: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 3l16 18M20 3L4 21" />
    </svg>
  ),
  whatsapp: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  behance: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 6h5.5a2.75 2.75 0 0 1 0 5.5H2zM2 11.5h6a3 3 0 0 1 0 6H2zM14 13.5h8a4 4 0 0 0-8 0 4 4 0 0 0 7.2 2.4M15 7h6" />
    </svg>
  ),
  dribbble: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8.6 2.6C13 8 15 13.5 15.8 21.4M2.3 10.5c6.9.6 12.3-1 16.3-5.1M21.8 13.7c-5-1.6-9.7-1-13.6 2.6" />
    </svg>
  ),
  pinterest: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 21c-.6-2.3.3-5.4.9-8 .4-1.7 1.5-3.2 3.2-3.2 1.6 0 2.6 1.2 2.6 2.8 0 1.9-1.2 4.2-3 4.2-1 0-1.7-.8-1.5-1.8" />
    </svg>
  ),
}

const GENERIC_SOCIAL_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
  </svg>
)

const FAQS = [
  {
    q: 'How quickly do you respond to enquiries?',
    a: 'We usually respond within 24 hours on business days. For urgent projects, feel free to reach out via WhatsApp for a faster reply.',
  },
  {
    q: 'Do you work with international clients?',
    a: 'Yes, we work with clients worldwide. Our team operates remotely and collaborates seamlessly across time zones.',
  },
  {
    q: 'Can I request a custom package?',
    a: 'Absolutely. Every project is unique. We tailor our solutions to your specific goals, budget, and timeline — just let us know what you need.',
  },
  {
    q: 'Do you offer ongoing monthly services?',
    a: 'Yes! We offer retainer-based packages for social media management, content creation, SEO, and ongoing marketing support — ideal for businesses looking for consistent growth.',
  },
]

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function Hero() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setWordIndex((p) => (p + 1) % CYCLE_WORDS.length),
      2400
    )
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="heroInner"
        >
          {/* Row 1 */}
          <div className="heroRow heroRow1">
            <span>Let&apos;s make</span>
            <span className="heroItalic">&nbsp;something&nbsp;</span>
            <span>great!</span>
          </div>

          {/* Row 2 */}
          <div className="heroRow heroRow2">
            <a href="#contact-form" className="heroPill">
              Reach out
            </a>
            <a href="mailto:info@markui.lk" className="heroEmailLink">info@markui.lk</a>
          </div>

          {/* Row 3 */}
          <div className="heroRow heroRow3">
            <span>for</span>
            <span className="heroWonderful">
              <span className="heroWonderfulText">wonderful</span>
              <span className="heroWonderfulLine" />
            </span>
            <span className="heroCycle" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.32, ease: 'easeInOut' }}
                  className="heroCycleWord"
                >
                  {CYCLE_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <svg
              aria-hidden="true"
              className="heroStar"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c.6 3.6 1.6 6.2 3 7.7 1.5 1.5 4 2.5 7.7 3-3.6.6-6.2 1.6-7.7 3-1.5 1.5-2.5 4-3 7.7-.6-3.6-1.6-6.2-3-7.7-1.5-1.5-4-2.5-7.7-3 3.6-.6 6.2-1.6 7.7-3 1.5-1.5 2.5-4 3-7.7z" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Promise ticker */}
      <div className="promiseStrip">
        <div className="promiseTrack">
          {[...PROMISES, ...PROMISES].map((p, i) => (
            <div key={i} className="promiseItem">
              <span className="promiseDot" aria-hidden="true" />
              {p}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// CONVERSATIONAL FORM
// ─────────────────────────────────────────────

function Form() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [sendError, setSendError] = useState('')
  /** Hidden from people, tempting to bots — see submitEnquiry. */
  const [honeypot, setHoneypot] = useState('')
  /**
   * A field complains only once the visitor has finished with it, so a
   * half-typed address is not called wrong while they are still typing it.
   * After that it re-checks on every keystroke, so the message clears the
   * moment they fix it.
   */
  const [touched, setTouched] = useState<{ phone?: boolean; email?: boolean }>({})

  const phoneMsg = touched.phone ? phoneError(phone) : null
  const emailMsg = touched.email ? emailError(email) : null

  async function handleSubmit() {
    const newErrors: string[] = []
    if (!name.trim()) newErrors.push('name')
    if (!selectedService) newErrors.push('service')
    if (!phone.trim() && !email.trim()) newErrors.push('contact')
    setErrors(newErrors)
    setSendError('')

    // Show any format problems even on fields never focused, e.g. a paste.
    setTouched({ phone: true, email: true })
    if (phoneError(phone) || emailError(email)) return
    if (newErrors.length > 0) return

    setLoading(true)
    const result = await submitEnquiry({
      source: 'contact',
      name,
      email,
      phone,
      company,
      service: selectedService,
      message,
      website: honeypot,
    })
    setLoading(false)

    if (!result.ok) {
      setSendError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
    setName(''); setCompany(''); setPhone('')
    setSelectedService(''); setEmail(''); setMessage('')
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="formSuccess"
      >
        <div className="formSuccessIcon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="formSuccessHeading">
          We&apos;ll be in touch <span className="accent">soon.</span>
        </p>
        <p className="formSuccessSub">
          Thanks for reaching out. We review every project and reply within 24 hours.
        </p>
        <button onClick={() => setSubmitted(false)} className="formResetBtn">
          Send another message
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="formWrap"
      id="contact-form"
    >

      {/* Section eyebrow */}
      <div className="formEyebrow">
        <span className="formEyebrowDot" />
        We&apos;d love to hear from you
      </div>

      {/* ── Line: Name ── */}
      <div className="formLine">
        <span className="formText">Hi, I&apos;m</span>
        <div className={`formField${errors.includes('name') ? ' formFieldError' : ''}`}>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(errors.filter(e => e !== 'name')) }}
            placeholder="your name"
            className="formInput"
          />
          <span className="formUnderline" />
        </div>
      </div>

      {/* ── Line: Company ── */}
      <div className="formLine">
        <span className="formText">and I work at</span>
        <div className="formField formFieldWide">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="company name"
            className="formInput"
          />
          <span className="formUnderline" />
        </div>
      </div>

      {/* ── Line: Phone ── */}
      <div className="formLine">
        <span className="formText">reach me on</span>
        <div className={`formField${errors.includes('contact') || phoneMsg ? ' formFieldError' : ''}`}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors(errors.filter(e => e !== 'contact')) }}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            placeholder="+94 77 123 4567"
            className="formInput"
            aria-invalid={phoneMsg ? true : undefined}
            aria-describedby={phoneMsg ? 'contact-phone-error' : undefined}
          />
          <span className="formUnderline" />
        </div>
        {phoneMsg ? (
          <span className="formFieldMsg" id="contact-phone-error" role="alert">
            {phoneMsg}
          </span>
        ) : null}
      </div>

      {/* ── Block: Service ── */}
      <div className="formBlock">
        <p className="formBlockText">I&apos;m looking for help with:</p>
        <div className="formPills" role="group" aria-label="Select a service">
          {SERVICES.map((s) => {
            const isActive = selectedService === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setSelectedService(s === selectedService ? '' : s); setErrors(errors.filter(e => e !== 'service')) }}
                className={`formPill${isActive ? ' formPillActive' : ''}${errors.includes('service') ? ' formPillErr' : ''}`}
                aria-pressed={isActive}
              >
                <span className={`formPillRadio${isActive ? ' formPillRadioActive' : ''}`} />
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Line: Email ── */}
      <div className="formLine formLineWrap">
        <span className="formText">Feel free to reach me at</span>
        <div className={`formField formFieldWide${errors.includes('contact') || emailMsg ? ' formFieldError' : ''}`}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(errors.filter(e => e !== 'contact')) }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="your email address"
            className="formInput"
            aria-invalid={emailMsg ? true : undefined}
            aria-describedby={emailMsg ? 'contact-email-error' : undefined}
          />
          <span className="formUnderline" />
        </div>
        <span className="formText">and let&apos;s talk.</span>
        {emailMsg ? (
          <span className="formFieldMsg" id="contact-email-error" role="alert">
            {emailMsg}
          </span>
        ) : null}
      </div>

      {/* ── Block: Message ── */}
      <div className="formBlock formBlockMsg">
        <p className="formBlockText">I&apos;d like to share more about my project:</p>
        <div className="formField formFieldFull">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your project, goals, and timeline…"
            className="formInput formTextarea"
            rows={3}
          />
          <span className="formUnderline" />
        </div>
      </div>

      {/* Hidden from people; a filled value marks the sender as a bot. */}
      <div className="formHoneypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* ── Submit ── */}
      {sendError ? (
        <p className="formSendError" role="alert">{sendError}</p>
      ) : null}

      <div className="formFooter">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`formSubmitBtn${loading ? ' formSubmitLoading' : ''}`}
        >
          {loading ? (
            <>
              <span className="formSpinner" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              Start a Journey
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// SERVICE CARD ROTATOR
// ─────────────────────────────────────────────

function ServiceCards() {
  const [active, setActive] = useState(0)
  const total = SERVICE_CATEGORIES.length

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % total), 4000)
    return () => clearInterval(id)
  }, [total])

  const cat = SERVICE_CATEGORIES[active]

  return (
    <div className="svcCard">
      <div className="svcProgress">
        <div key={active} className="svcProgressBar" />
      </div>
      <div className="svcCardBody">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <p className="svcCardTitle">{cat.title}</p>
            <p className="svcCardDesc">{cat.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="svcDots">
        {SERVICE_CATEGORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={SERVICE_CATEGORIES[i].title}
            className={`svcDot${i === active ? ' svcDotActive' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// INFO PANEL
// ─────────────────────────────────────────────

function Info({ socialLinks }: { socialLinks: SocialLink[] }) {
  return (
    <aside className="infoPanel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="infoHeader"
      >
        <h2 className="infoHeading">
          GET IN <span className="accent">TOUCH</span>
        </h2>
        <p className="infoSub">
          We&apos;re always ready to hear about your next big project.
        </p>
      </motion.div>

      <ul className="infoList">
        {INFO_ITEMS.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.065 }}
            className="infoItem"
          >
            <div className="infoIconBox" aria-hidden="true">{item.icon}</div>
            <div>
              <p className="infoLabel">{item.label}</p>
              {item.href ? (
                <a
                  className="infoValue infoValueLink"
                  href={item.href}
                  {...(item.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {item.value}
                </a>
              ) : (
                <p className="infoValue">{item.value}</p>
              )}
            </div>
          </motion.li>
        ))}
      </ul>

      <ServiceCards />

      {socialLinks.length ? (
        <nav className="socialRow" aria-label="Social media links">
          {socialLinks.map((s) => (
            <a
              key={`${s.label}-${s.url}`}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="socialBtn"
            >
              {SOCIAL_ICONS[s.label.trim().toLowerCase()] ?? GENERIC_SOCIAL_ICON}
            </a>
          ))}
        </nav>
      ) : null}
    </aside>
  )
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faqSection" aria-label="Frequently asked questions">
      <div className="faqHeader">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="faqHeading"
        >
          FREQUENTLY<br />
          <span className="accent">ASKED</span>
        </motion.h2>
        <p className="faqSub">
          Still have questions? We&apos;re happy to answer anything before you reach out.
        </p>
      </div>

      <ul className="faqList">
        {FAQS.map((faq, i) => (
          <li key={i} className="faqItem">
            <button
              className="faqQuestion"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="faqNum">0{i + 1}</span>
              <span className="faqQText">{faq.q}</span>
              <motion.span
                animate={{ rotate: open === i ? 45 : 0 }}
                transition={{ duration: 0.22 }}
                className="faqToggle"
                aria-hidden="true"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  key="ans"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="faqAnswerWrap"
                >
                  <p className="faqAnswer">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─────────────────────────────────────────────
// CTA STRIP
// ─────────────────────────────────────────────

function CTA() {
  return (
    <div className="ctaSection">
      <p className="ctaHeading">
        READY TO <span className="ctaWhite">START</span><br />
        YOUR PROJECT?
      </p>
      <Link href="tel:+94XXXXXXXX" className="ctaButton">
        Book a Free Call
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function ContactPage({
  socialLinks = [],
}: {
  /** Managed in the dashboard (Footer & Social) — the same list the footer shows. */
  socialLinks?: SocialLink[]
}) {
  return (
    <main className="page">
      <Hero />

      <section className="mainGrid">
        <Form />
        <Info socialLinks={socialLinks} />
      </section>

      <FAQ />
      <CTA />

      <style jsx global>{`
        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ul, li { list-style: none; }
        button { background: none; border: none; cursor: pointer; }
        a { text-decoration: none; color: inherit; }

        /* ── Tokens ── */
        :root {
          --bg:           #EEEEEC;
          --surface:      #E8E8E6;
          --surface-2:    #DDDDD9;
          --border:       rgba(10,10,10,0.10);
          --border-mid:   rgba(10,10,10,0.16);
          --text:         #111111;
          --text-2:       #555553;
          --text-3:       #888886;
          --accent:       #FF6B00;
          --accent-h:     #E55D00;
          --white:        #ffffff;
          --radius-pill:  100px;
          --radius-card:  18px;
          --ease-out:     cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Base ── */
        .page {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-sans, system-ui, sans-serif);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .accent { color: var(--accent); }

        /* ─────────────────────────────────────────────
           HERO
        ───────────────────────────────────────────── */
        /* Orange opening band, like the other main pages. Text inside it is
           white; the accents that were orange switch to black to stay visible. */
        .hero {
          padding: 136px 5% 72px;
          background: var(--accent);
        }
        .hero .heroRow,
        .hero .heroItalic { color: #ffffff; }
        .hero .heroPill { border-color: #ffffff; color: #ffffff; }
        .hero .heroPill:hover { background: #ffffff; color: var(--accent); }
        .hero .heroEmailLink { color: #0a0a0a; }
        .hero .heroWonderfulText { color: rgba(255,255,255,0.8); }
        .hero .heroWonderfulLine { background: #ffffff; }
        .hero .heroStar { color: #0a0a0a; }

        .heroInner {
          max-width: 1160px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .heroRow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(34px, 5.4vw, 68px);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: var(--text);
          gap: 0.2em;
        }

        .heroItalic {
          font-style: italic;
          font-weight: 400;
          color: var(--text);
        }

        .heroRow2 {
          gap: 20px;
          align-items: center;
        }

        .heroPill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 148px;
          height: 60px;
          border: 1.5px solid var(--text);
          border-radius: var(--radius-pill);
          font-family: var(--font-display, Georgia, serif);
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--text);
          flex-shrink: 0;
          transition: background 0.18s, color 0.18s;
        }

        .heroPill:hover {
          background: var(--text);
          color: var(--bg);
        }

        .heroEmailLink {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(34px, 5.4vw, 68px);
          font-weight: 500;
          letter-spacing: -0.025em;
          color: var(--accent);
          text-decoration: underline;
          text-decoration-thickness: 1.5px;
          text-underline-offset: 6px;
          line-height: 1.1;
          transition: opacity 0.15s;
        }

        .heroEmailLink:hover { opacity: 0.75; }

        .heroRow3 { gap: 0.25em; }

        .heroWonderful {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          margin: 0 0.1em;
        }

        .heroWonderfulText {
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(17,17,17,0.45);
          line-height: 1;
        }

        .heroWonderfulLine {
          display: block;
          width: 72px;
          height: 1px;
          background: var(--text);
        }

        .heroCycle {
          position: relative;
          display: inline-flex;
          overflow: hidden;
        }

        .heroCycleWord {
          display: inline-block;
          white-space: nowrap;
        }

        .heroStar {
          color: var(--accent);
          flex-shrink: 0;
          margin-left: 0.05em;
        }

        @media (max-width: 640px) {
          .hero { padding: 112px 5% 48px; }
          .heroRow { gap: 0.18em; }
          .heroPill { min-width: 116px; height: 50px; font-size: 13px; }
          .heroWonderfulLine { width: 48px; }
          .heroStar { width: 22px; height: 22px; }
        }

        /* ─────────────────────────────────────────────
           PROMISE STRIP
        ───────────────────────────────────────────── */
        .promiseStrip {
          border-top: 1px solid var(--border-mid);
          border-bottom: 1px solid var(--border-mid);
          background: var(--surface);
          overflow: hidden;
          padding: 0;
        }

        .promiseTrack {
          display: flex;
          width: max-content;
          animation: marquee 28s linear infinite;
          padding: 14px 0;
        }

        .promiseItem {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 32px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-3);
          white-space: nowrap;
        }

        .promiseDot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .promiseTrack { animation: none; }
        }

        /* ─────────────────────────────────────────────
           MAIN GRID
        ───────────────────────────────────────────── */
        .mainGrid {
          display: flex;
          flex-direction: column;
          max-width: 1440px;
          margin: 0 auto;
          padding: 72px 5% 80px;
          gap: 72px;
        }

        @media (min-width: 1024px) {
          .mainGrid {
            flex-direction: row;
            align-items: flex-start;
            padding: 96px 6% 108px;
            gap: 80px;
          }
        }

        /* ─────────────────────────────────────────────
           FORM
        ───────────────────────────────────────────── */
        .formWrap {
          flex: 1.35;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Eyebrow */
        .formEyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-3);
          margin-bottom: 40px;
        }

        .formEyebrowDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }

        /* Sentence rows */
        .formLine {
          display: flex;
          align-items: flex-end;
          flex-wrap: wrap;
          row-gap: 10px;
          column-gap: 14px;
          padding: 4px 0;
        }

        .formLineWrap {
          row-gap: 12px;
        }

        /* Display-size prose label */
        .formText {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(28px, 3.8vw, 50px);
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: var(--text);
          white-space: nowrap;
        }

        /* Block heading (same size, wraps) */
        .formBlockText {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(28px, 3.8vw, 50px);
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: var(--text);
          margin-bottom: 22px;
        }

        /* Field container */
        .formField {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-width: 180px;
        }

        .formFieldWide { min-width: 260px; }
        .formFieldFull { width: 100%; }

        /* Underline input */
        .formInput {
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(28px, 3.8vw, 50px);
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: var(--accent);
          caret-color: var(--accent);
          padding: 0 0 3px;
          width: 100%;
        }

        .formInput::placeholder {
          color: rgba(17,17,17,0.20);
        }

        .formInput:-webkit-autofill,
        .formInput:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--accent);
          -webkit-box-shadow: 0 0 0 1000px var(--bg) inset;
        }

        /* Underline bar */
        .formUnderline {
          display: block;
          height: 1.5px;
          background: var(--border-mid);
          border-radius: 2px;
          transition: background 0.18s;
        }

        .formField:focus-within .formUnderline {
          background: var(--accent);
        }

        .formFieldError .formUnderline {
          background: #d32f2f !important;
        }

        /* Why a field is being rejected, under the line it belongs to. */
        .formFieldMsg {
          flex-basis: 100%;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          color: #d32f2f;
        }

        /* Block sections */
        .formBlock {
          padding-top: 32px;
        }

        .formBlockMsg {
          padding-top: 48px;
        }

        /* Textarea */
        .formTextarea {
          resize: none;
          font-family: var(--font-sans, system-ui, sans-serif) !important;
          font-size: clamp(17px, 1.9vw, 22px) !important;
          font-weight: 400 !important;
          line-height: 1.65 !important;
          color: var(--text) !important;
          caret-color: var(--accent) !important;
          min-height: 72px;
        }

        .formTextarea::placeholder {
          color: rgba(17,17,17,0.22) !important;
        }

        /* Pills */
        .formPills {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .formPill {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 18px;
          border: 1.5px solid var(--border-mid);
          border-radius: var(--radius-pill);
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-2);
          transition: border-color 0.16s, color 0.16s, background 0.16s;
          line-height: 1;
        }

        .formPill:hover {
          border-color: rgba(17,17,17,0.32);
          color: var(--text);
        }

        .formPillActive {
          border-color: var(--text) !important;
          color: var(--text) !important;
        }

        .formPillErr { border-color: #d32f2f !important; }

        .formPillRadio {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 1.5px solid rgba(17,17,17,0.22);
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .formPillRadioActive {
          border-color: var(--text);
          background: var(--text);
          box-shadow: inset 0 0 0 3px var(--bg);
        }

        /* Submit row */
        /* Off-screen rather than display:none, which some bots skip. */
        .formHoneypot {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .formSendError {
          margin-top: 32px;
          padding: 14px 18px;
          border: 1px solid rgba(200,40,40,0.28);
          border-radius: 10px;
          background: rgba(200,40,40,0.06);
          color: #a11;
          font-size: 14px;
          line-height: 1.5;
        }

        .formFooter {
          display: flex;
          justify-content: flex-end;
          padding-top: 40px;
        }

        .formSubmitBtn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--text);
          color: var(--white);
          border-radius: var(--radius-pill);
          padding: 16px 32px;
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          transition: background 0.18s, transform 0.18s, opacity 0.18s;
        }

        .formSubmitBtn:hover:not(:disabled) {
          background: #333;
          transform: translateY(-2px);
        }

        .formSubmitBtn:disabled { opacity: 0.35; cursor: not-allowed; }
        .formSubmitLoading { background: var(--text-3) !important; }

        .formSpinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: var(--white);
          border-radius: 50%;
          animation: spin 0.85s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success */
        .formSuccess {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-height: 480px;
          justify-content: center;
          gap: 20px;
        }

        .formSuccessIcon {
          width: 68px;
          height: 68px;
          background: var(--accent);
          color: var(--white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .formSuccessHeading {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(34px, 4.2vw, 56px);
          font-weight: 500;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: var(--text);
        }

        .formSuccessSub {
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-2);
          max-width: 380px;
        }

        .formResetBtn {
          border: 1.5px solid var(--border-mid);
          color: var(--text-2);
          border-radius: var(--radius-pill);
          padding: 12px 26px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
          transition: border-color 0.16s, color 0.16s;
        }

        .formResetBtn:hover {
          border-color: var(--text);
          color: var(--text);
        }

        /* Mobile form tweaks */
        @media (max-width: 640px) {
          .formText, .formBlockText, .formInput {
            font-size: clamp(24px, 7vw, 36px);
          }
          .formField { min-width: 140px; }
          .formFieldWide { min-width: 180px; }
          .formFooter { justify-content: flex-start; }
          .formSubmitBtn { width: 100%; justify-content: center; }
          .formEyebrow { margin-bottom: 28px; }
          .formBlock { padding-top: 24px; }
          .formBlockMsg { padding-top: 36px; }
        }

        /* ─────────────────────────────────────────────
           INFO PANEL
        ───────────────────────────────────────────── */
        .infoPanel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 44px;
        }

        @media (min-width: 1024px) {
          .infoPanel {
            position: sticky;
            top: 100px;
            align-self: flex-start;
          }
        }

        .infoHeader {}

        .infoHeading {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(28px, 2.6vw, 36px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text);
          margin-bottom: 10px;
        }

        .infoSub {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-2);
        }

        .infoList {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .infoItem {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .infoIconBox {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--accent);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .infoLabel {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-3);
          margin-bottom: 3px;
        }

        .infoValue {
          font-size: 15px;
          font-weight: 500;
          color: var(--text);
        }

        /* Email, phone and WhatsApp open in the visitor's own app. */
        .infoValueLink {
          display: inline-block;
          transition: color 0.16s;
        }

        .infoValueLink:hover,
        .infoValueLink:focus-visible {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Service card ── */
        .svcCard {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          padding: 28px 28px 24px;
          position: relative;
          overflow: hidden;
        }

        .svcProgress {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 3px;
          background: rgba(0,0,0,0.06);
        }

        .svcProgressBar {
          height: 100%;
          background: var(--accent);
          animation: svcProg 4s linear forwards;
        }

        @keyframes svcProg {
          from { width: 0; }
          to   { width: 100%; }
        }

        .svcCardBody {
          min-height: 124px;
          margin-bottom: 20px;
        }

        .svcCardTitle {
          font-size: 17px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .svcCardDesc {
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-2);
        }

        .svcDots {
          display: flex;
          gap: 8px;
        }

        .svcDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--border-mid);
          padding: 0;
          transition: background 0.2s, transform 0.2s;
        }

        .svcDotActive {
          background: var(--accent);
          transform: scale(1.45);
        }

        /* ── Socials ── */
        .socialRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          border-top: 1px solid var(--border);
          padding-top: 28px;
        }

        .socialBtn {
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid var(--border-mid);
          color: var(--text-3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.16s, border-color 0.16s, transform 0.16s, background 0.16s;
        }

        .socialBtn:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(255,107,0,0.06);
          transform: translateY(-2px);
        }

        /* ─────────────────────────────────────────────
           FAQ
        ───────────────────────────────────────────── */
        .faqSection {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 5% 108px;
        }

        .faqHeader {
          text-align: center;
          margin-bottom: 56px;
        }

        .faqHeading {
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(34px, 5vw, 56px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: var(--text);
          margin-bottom: 14px;
        }

        .faqSub {
          font-size: 15px;
          color: var(--text-2);
          line-height: 1.6;
        }

        .faqList {
          display: flex;
          flex-direction: column;
        }

        .faqItem {
          border-bottom: 1px solid var(--border-mid);
        }

        .faqItem:first-child {
          border-top: 1px solid var(--border-mid);
        }

        .faqQuestion {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 22px 0;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .faqNum {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-3);
          letter-spacing: 0.05em;
          flex-shrink: 0;
          width: 24px;
        }

        .faqQText {
          flex: 1;
          font-size: 17px;
          font-weight: 600;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.35;
        }

        .faqToggle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid var(--border-mid);
          color: var(--text-3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.16s, color 0.16s, background 0.16s;
        }

        .faqItem:hover .faqToggle,
        .faqQuestion[aria-expanded="true"] .faqToggle {
          border-color: var(--accent);
          color: var(--accent);
        }

        .faqQuestion[aria-expanded="true"] .faqToggle {
          background: var(--accent);
          color: var(--white);
        }

        .faqAnswerWrap { overflow: hidden; }

        .faqAnswer {
          padding: 0 0 22px 44px;
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text-2);
        }

        @media (max-width: 640px) {
          .faqQuestion { gap: 14px; padding: 18px 0; }
          .faqQText { font-size: 15px; }
          .faqAnswer { padding: 0 0 18px 38px; font-size: 14px; }
        }

        /* ─────────────────────────────────────────────
           CTA
        ───────────────────────────────────────────── */
        .ctaSection {
          background: var(--accent);
          padding: 72px 5%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 28px;
          position: relative;
          overflow: hidden;
        }

        .ctaSection::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .ctaHeading {
          position: relative;
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(30px, 5.5vw, 52px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.0;
          color: rgba(255,255,255,0.45);
        }

        .ctaWhite {
          color: var(--white);
        }

        .ctaButton {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--white);
          color: var(--accent);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 16px 32px;
          border-radius: var(--radius-pill);
          transition: background 0.18s, transform 0.18s;
        }

        .ctaButton:hover {
          background: rgba(255,255,255,0.88);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  )
}