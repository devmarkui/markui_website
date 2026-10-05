"use client";

import { useActionState } from "react";

import { saveContactDetails, type FormState } from "@/app/admin/actions";
import { MAX_CONTACT_PHONES, type ContactDetails } from "@/lib/types";

const INITIAL: FormState = {};

const SLOTS = Array.from({ length: MAX_CONTACT_PHONES }, (_, i) => i);

/**
 * The studio's direct lines. One place to change a number: the nav menu, the
 * footer, the contact page, the Book a Call chooser and the homepage all
 * read what is saved here.
 */
export default function ContactDetailsForm({ contact }: { contact: ContactDetails }) {
  const [state, action, pending] = useActionState(saveContactDetails, INITIAL);

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Contact Details</h1>
          <p className="ad-subtitle">
            Phone numbers, WhatsApp, email, address and hours. They appear in the menu, the footer, the
            contact page, the <strong>Book a Call</strong> pop-up and the homepage, so a change here
            reaches every page.
          </p>
        </div>
      </div>

      {state.error ? (
        <div className="ad-alert ad-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <div className="ad-alert ad-alert--ok" role="status">
          {state.message}
        </div>
      ) : null}

      <div className="ad-panel ad-settings-form">
        <form action={action}>
          {SLOTS.map((i) => {
            const phone = contact.phones[i];
            return (
              <div className="ad-field" key={i} style={i ? { marginTop: 20 } : undefined}>
                <label className="ad-label" htmlFor={`cd-phone-${i}`}>
                  {i === 0 ? "Main phone number" : `Phone number ${i + 1} (optional)`}
                </label>
                <input
                  id={`cd-phone-${i}`}
                  name={`phone${i}`}
                  type="tel"
                  inputMode="tel"
                  defaultValue={phone?.number ?? ""}
                  placeholder="+94 7X XXX XXXX"
                  autoComplete="off"
                  required={i === 0}
                />
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input type="checkbox" name={`whatsapp${i}`} defaultChecked={phone ? phone.whatsapp : true} />
                  <span>This number is on WhatsApp</span>
                </label>
                {i === 0 ? (
                  <p className="ad-hint">
                    Write numbers the way they should be printed, starting with the country code:{" "}
                    <code>+94 76 088 7702</code>. The first number is the one the Call and WhatsApp buttons use;
                    the others are listed after it. Leave a field empty to remove that number.
                  </p>
                ) : null}
              </div>
            );
          })}

          <div className="ad-field" style={{ marginTop: 28 }}>
            <label className="ad-label" htmlFor="cd-email">
              Email address
            </label>
            <input
              id="cd-email"
              name="email"
              type="email"
              defaultValue={contact.email}
              placeholder="info@markui.lk"
              autoComplete="off"
              spellCheck={false}
              required
            />
            <p className="ad-hint">
              Shown as a link visitors can tap. Enquiry forms are delivered separately (the MAIL_TO setting on the
              server), so changing this does not change where form submissions go.
            </p>
          </div>

          <div className="ad-field" style={{ marginTop: 20 }}>
            <label className="ad-label" htmlFor="cd-location">
              Short location
            </label>
            <input
              id="cd-location"
              name="location"
              type="text"
              defaultValue={contact.location}
              placeholder="Colombo, Sri Lanka"
              maxLength={60}
              required
            />
            <p className="ad-hint">City and country only. Used in the footer and on the homepage, where space is tight.</p>
          </div>

          <div className="ad-field" style={{ marginTop: 20 }}>
            <label className="ad-label" htmlFor="cd-address">
              Studio address
            </label>
            <input
              id="cd-address"
              name="address"
              type="text"
              defaultValue={contact.address}
              placeholder="Street, area, city, country"
              maxLength={160}
              required
            />
            <p className="ad-hint">The full address, on one line. Shown on the contact page.</p>
          </div>

          <div className="ad-field" style={{ marginTop: 20 }}>
            <label className="ad-label" htmlFor="cd-hours">
              Opening hours
            </label>
            <input
              id="cd-hours"
              name="hours"
              type="text"
              defaultValue={contact.hours}
              placeholder="Mon – Fri · 9:00 AM – 5:00 PM"
              maxLength={80}
              required
            />
            <p className="ad-hint">
              Keep it to one short line. It also completes the sentence &ldquo;We pick up …&rdquo; in the Book a
              Call pop-up.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
              {pending ? "Saving…" : "Save contact details"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
