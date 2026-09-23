import nodemailer, { type Transporter } from "nodemailer";

import { ENQUIRY_SOURCE_LABELS, type Enquiry } from "./types";

/**
 * Sends the enquiry notifications over SMTP.
 *
 * Everything comes from the environment, so no address or credential lives in
 * the repository:
 *
 *   SMTP_HOST   mail server hostname        (e.g. mail.markui.lk)
 *   SMTP_PORT   465 for SSL, 587 for TLS    (default 587)
 *   SMTP_USER   mailbox login               (e.g. info@markui.lk)
 *   SMTP_PASS   mailbox password
 *   MAIL_TO     where enquiries land        (default SMTP_USER)
 *   MAIL_FROM   the From: address           (default SMTP_USER)
 *
 * With SMTP_HOST unset, `sendEnquiryEmail` reports that mail is not configured
 * instead of throwing. The submission is already stored by then, so the visitor
 * still gets a thank-you and the enquiry is waiting in the dashboard.
 */

const globalForMail = globalThis as unknown as { markuiTransport?: Transporter };

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

/** The mailbox enquiries are delivered to. */
export function enquiryRecipient(): string {
  return process.env.MAIL_TO || process.env.SMTP_USER || "";
}

/** One transport per process, reused across hot reloads like the db pool. */
function transport(): Transporter {
  if (!globalForMail.markuiTransport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    globalForMail.markuiTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS.
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return globalForMail.markuiTransport;
}

/** Escapes a value so a visitor's text cannot inject markup into the email. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strips CR/LF so a value can never add headers of its own. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function rows(enquiry: Enquiry): [string, string][] {
  return (
    [
      ["Name", enquiry.name],
      ["Company", enquiry.company],
      ["Email", enquiry.email],
      ["Phone", enquiry.phone],
      ["Service", enquiry.service],
      ["Sent from", ENQUIRY_SOURCE_LABELS[enquiry.source]],
      ["Received", new Date(enquiry.createdAt).toLocaleString("en-GB")],
    ] as [string, string][]
  ).filter(([, value]) => value);
}

function textBody(enquiry: Enquiry): string {
  const lines = rows(enquiry).map(([label, value]) => `${label}: ${value}`);
  if (enquiry.message) lines.push("", "Message:", enquiry.message);
  return lines.join("\n");
}

function htmlBody(enquiry: Enquiry): string {
  const cells = rows(enquiry)
    .map(
      ([label, value]) =>
        `<tr>` +
        `<td style="padding:8px 16px 8px 0;color:#888;font:600 12px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;vertical-align:top;white-space:nowrap">${esc(label)}</td>` +
        `<td style="padding:8px 0;color:#111;font:400 15px/1.5 Arial,sans-serif">${esc(value)}</td>` +
        `</tr>`,
    )
    .join("");

  const message = enquiry.message
    ? `<p style="margin:24px 0 8px;color:#888;font:600 12px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em">Message</p>` +
      `<p style="margin:0;color:#111;font:400 15px/1.7 Arial,sans-serif;white-space:pre-wrap">${esc(enquiry.message)}</p>`
    : "";

  return (
    `<div style="max-width:640px;margin:0 auto;padding:32px 24px;background:#ffffff">` +
    `<p style="margin:0 0 4px;color:#ff6b00;font:700 12px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.14em">New enquiry</p>` +
    `<h1 style="margin:0 0 24px;color:#111;font:700 24px/1.2 Arial,sans-serif">${esc(enquiry.name || "Website enquiry")}</h1>` +
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${cells}</table>` +
    message +
    `</div>`
  );
}

export interface MailResult {
  sent: boolean;
  /** Why it did not send, for the server log. */
  reason?: string;
}

/**
 * Emails one enquiry to the site's mailbox. Never throws: the caller has
 * already stored the submission, and a mail failure must not lose it or show
 * the visitor an error.
 */
export async function sendEnquiryEmail(enquiry: Enquiry): Promise<MailResult> {
  if (!mailConfigured()) {
    return { sent: false, reason: "SMTP is not configured (SMTP_HOST / SMTP_USER)" };
  }

  const to = enquiryRecipient();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || to;
  const who = headerSafe(enquiry.name) || "Website visitor";
  const subject = `New enquiry — ${who}${enquiry.service ? ` · ${headerSafe(enquiry.service)}` : ""}`;

  try {
    await transport().sendMail({
      to,
      from: { name: "Mark UI website", address: from },
      // Replying goes to the visitor, not back to the site's own mailbox.
      ...(enquiry.email ? { replyTo: headerSafe(enquiry.email) } : {}),
      subject,
      text: textBody(enquiry),
      html: htmlBody(enquiry),
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
