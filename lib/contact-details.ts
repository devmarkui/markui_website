import type { ContactDetails } from "./types";

/**
 * The studio's direct lines, ready to link. The numbers, email, address and
 * hours themselves are edited in the dashboard (Contact Details) and arrive
 * as `settings.contact`; this turns them into the tel:, wa.me and mailto:
 * links the nav drawer, the footer, the contact page, the Book a Call
 * chooser and the homepage (lib/landing.ts) all use.
 */

export interface PhoneLine {
  /** As printed: "+94 76 088 7702". */
  label: string;
  /** For tel: links: "+94760887702". */
  tel: string;
  /** Digits only, for wa.me links; null when the number is not on WhatsApp. */
  whatsapp: string | null;
}

/** Every "Book a Call" goes here: the contact page, with the chooser open. */
export const BOOK_CALL_HREF = "/contact?call=1";

/** The message a WhatsApp chat opens with, so it never starts blank. */
const WHATSAPP_GREETING = "Hi Mark UI, I'd like to talk about a project.";

/** "+94 76 088 7702" → "94760887702". */
export const phoneDigits = (number: string) => number.replace(/\D/g, "");

export function phoneLines(contact: ContactDetails): PhoneLine[] {
  return contact.phones.map((phone) => {
    const digits = phoneDigits(phone.number);
    return {
      label: phone.number,
      tel: phone.number.trim().startsWith("+") ? `+${digits}` : digits,
      whatsapp: phone.whatsapp ? digits : null,
    };
  });
}

/** The lines that are on WhatsApp, in display order. */
export const whatsappLines = (contact: ContactDetails) =>
  phoneLines(contact).filter((line) => line.whatsapp);

export const telHref = (line: PhoneLine) => `tel:${line.tel}`;

export const whatsappHref = (line: PhoneLine) =>
  `https://wa.me/${line.whatsapp}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;

export const mailHref = (email: string) => `mailto:${email}`;
