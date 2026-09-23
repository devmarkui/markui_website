"use server";

import { headers } from "next/headers";

import { emailError, phoneError } from "@/lib/contact-validation";
import { createEnquiry, markEnquiryEmailed } from "@/lib/enquiries";
import { mailConfigured, sendEnquiryEmail } from "@/lib/mailer";
import { ENQUIRY_LIMITS, isEnquirySource, type EnquirySource } from "@/lib/types";

/**
 * Takes a submission from the Contact page form or the Home page form.
 *
 * This is a public Server Action, so it is reachable by direct POST and not
 * only through the site's own UI — everything it receives is validated here,
 * and it is rate limited per address.
 *
 * The enquiry is stored first and emailed second. If the mail server is down
 * or unconfigured the visitor still sees a thank-you and the enquiry is in the
 * dashboard, rather than being lost with an error.
 */

export interface EnquiryFormInput {
  source: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  message?: string;
  /** Hidden field. Real people leave it empty; bots fill everything in. */
  website?: string;
}

export interface EnquiryResult {
  ok: boolean;
  /** Shown to the visitor when something is wrong with the submission. */
  error?: string;
}

/** At most this many submissions from one address per window. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Recent submissions per address. In memory, so it resets on restart and is
 * per instance — enough to stop casual flooding, not a substitute for a WAF.
 */
const globalForRate = globalThis as unknown as { markuiEnquiryHits?: Map<string, number[]> };
const hits = (globalForRate.markuiEnquiryHits ??= new Map<string, number[]>());

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-running server.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function submitEnquiry(input: EnquiryFormInput): Promise<EnquiryResult> {
  // A filled honeypot is a bot. Answer as if it worked so it learns nothing.
  if (input.website?.trim()) return { ok: true };

  const source: EnquirySource = isEnquirySource(input.source) ? input.source : "contact";
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const message = (input.message ?? "").trim();

  if (!name) return { ok: false, error: "Please tell us your name." };
  if (!email && !phone) {
    return { ok: false, error: "Please leave an email address or a phone number." };
  }
  const badEmail = emailError(email);
  if (badEmail) return { ok: false, error: `${badEmail}.` };

  const badPhone = phoneError(phone);
  if (badPhone) return { ok: false, error: `${badPhone}.` };

  if (message.length > ENQUIRY_LIMITS.message) {
    return { ok: false, error: "That message is too long — please shorten it." };
  }

  if (rateLimited(await clientKey())) {
    return {
      ok: false,
      error: "You have sent several messages already. Please try again a little later.",
    };
  }

  let enquiryId: string;
  try {
    const enquiry = await createEnquiry({
      source,
      name,
      email,
      phone,
      company: input.company,
      service: input.service,
      message,
    });
    enquiryId = enquiry.id;

    const result = await sendEnquiryEmail(enquiry);
    if (result.sent) {
      await markEnquiryEmailed(enquiry.id);
    } else {
      console.error(
        `[enquiry ${enquiry.id}] stored but not emailed: ${result.reason}` +
          (mailConfigured() ? "" : " — set SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local"),
      );
    }
  } catch (error) {
    console.error("[enquiry] could not be saved:", error);
    return {
      ok: false,
      error: "Sorry — we could not send that just now. Please try again, or email info@markui.lk.",
    };
  }

  console.log(`[enquiry ${enquiryId}] received from the ${source} form`);
  return { ok: true };
}
