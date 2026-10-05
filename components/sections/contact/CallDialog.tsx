"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import { phoneLines, telHref, whatsappHref, whatsappLines } from "@/lib/contact-details";
import type { ContactDetails } from "@/lib/types";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribe = () => () => {};

/**
 * The Book a Call chooser. Every "Book a Call" on the site lands on
 * /contact?call=1, and this opens over the page: call or WhatsApp, on any of
 * the studio's numbers (Contact Details in the dashboard). Its state is the
 * URL, so it opens the same way from any page and a refresh after closing
 * does not bring it back.
 */
export default function CallDialog({ contact }: { contact: ContactDetails }) {
  const phones = phoneLines(contact);
  const whatsapp = whatsappLines(contact);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const open = params.has("call");
  // The dialog is portalled to <body>, which only exists in the browser.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // While it is open: the page behind can't scroll or take focus, Escape
  // closes it and Tab stays inside it.
  useEffect(() => {
    if (!open || !mounted) return;
    const outside = [
      document.querySelector<HTMLElement>("header.nav"),
      document.getElementById("main"),
      document.querySelector<HTMLElement>("footer.footer"),
    ].filter((el): el is HTMLElement => Boolean(el));
    outside.forEach((el) => (el.inert = true));
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      outside.forEach((el) => (el.inert = false));
      document.body.style.overflow = previous;
    };
  }, [open, mounted, close]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="sx call">
      <div className="call-backdrop" onClick={close} />
      <div
        className="call-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-title"
        aria-describedby="call-text"
        tabIndex={-1}
        ref={panelRef}
      >
        <button className="call-close" type="button" aria-label="Close" onClick={close}>
          <span aria-hidden="true" />
        </button>

        <Chan className="is-live">Book a call</Chan>
        <h2 className="call-title" id="call-title">
          <span className="q">How would you like</span> to talk<span className="stop">?</span>
        </h2>
        <p className="call-text" id="call-text">
          Pick whichever is easier. We pick up {contact.hours}
          {whatsapp.length ? "; outside those hours, message us on WhatsApp and we'll reply first thing." : "."}
        </p>

        <div className="call-options">
          <div className="call-option">
            <h3 className="label" id="call-phone">
              Call us
            </h3>
            <ul aria-labelledby="call-phone">
              {phones.map((line) => (
                <li key={line.tel}>
                  <a className="call-link" href={telHref(line)} onClick={close} aria-label={`Call ${line.label}`}>
                    <span>{line.label}</span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {whatsapp.length ? (
            <div className="call-option">
              <h3 className="label" id="call-whatsapp">
                WhatsApp
              </h3>
              <ul aria-labelledby="call-whatsapp">
                {whatsapp.map((line) => (
                  <li key={line.tel}>
                    <a
                      className="call-link"
                      href={whatsappHref(line)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      aria-label={`WhatsApp ${line.label} (opens WhatsApp)`}
                    >
                      <span>{line.label}</span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <button
          className="btn-line call-write"
          type="button"
          onClick={() => {
            close();
            document.getElementById("enquiry")?.scrollIntoView({ block: "start" });
          }}
        >
          I&apos;d rather write: take me to the form <Arrow />
        </button>
      </div>
    </div>,
    document.body,
  );
}
