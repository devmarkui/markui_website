import Link from "next/link";

/**
 * The Vault has no navigation bar: only the Mark UI mark in the corner (back
 * to markui.lk) and, on a project, the way back to the Vault. It sits at the
 * top of the page and scrolls away with it.
 */
export default function VaultTop({ siteOrigin, back }: { siteOrigin: string; back?: boolean }) {
  return (
    <div className="vt-top">
      <a className="vt-top-logo" href={siteOrigin} aria-label="Mark UI — markui.lk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/markui-logo-white.png" alt="Mark UI" width={1600} height={319} />
      </a>
      {back ? (
        <Link className="vt-top-back mono" href="/">
          <span aria-hidden="true">←</span> The Vault
        </Link>
      ) : (
        <span className="vt-top-name mono">Creative Vault</span>
      )}
    </div>
  );
}
