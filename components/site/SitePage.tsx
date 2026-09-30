import type { ReactNode } from "react";

import SignalTrace from "./SignalTrace";

/**
 * The <main> of every page built on the site system. `.sx` carries the
 * tokens (styles/site/base.css) and tells the page chrome this page opens
 * on a dark masthead; the signal trace runs down its margin.
 */
export default function SitePage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className={className ? `sx pg ${className}` : "sx pg"}>
      {children}
      <SignalTrace />
    </main>
  );
}
