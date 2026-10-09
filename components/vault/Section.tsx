import type { ReactNode } from "react";

import Chan from "@/components/site/Chan";
import { LiveSection, Reveal } from "@/components/site/Reveal";
import type { Ground, VaultBlock } from "@/lib/vault/types";

export type ShownGround = Exclude<Ground, "auto">;

/**
 * One section of a Vault project, on its ground: the channel label with its
 * number, the heading and intro, then the content. `split` puts the heading
 * beside the content rather than above it.
 */
export default function Section({
  block,
  number,
  ground,
  split,
  bleed,
  children,
}: {
  block: Pick<VaultBlock, "id" | "type" | "label" | "title" | "intro">;
  number: number;
  ground: ShownGround;
  split?: boolean;
  /** Content runs to the window edges (rails, slideshows). */
  bleed?: ReactNode;
  children?: ReactNode;
}) {
  const titleId = `sec-${block.id}`;
  const head = (
    <header className="vt-sec-head">
      <Chan num={String(number).padStart(2, "0")}>{block.label || " "}</Chan>
      {block.title ? (
        <h2 className="vt-sec-title" id={titleId}>
          {block.title}
        </h2>
      ) : null}
      {block.intro ? (
        <Reveal as="p" className="vt-sec-intro">
          {block.intro}
        </Reveal>
      ) : null}
    </header>
  );

  return (
    <LiveSection
      className={`vt-sec vt-sec--${block.type} ground ground-${ground}`}
      data-ground={ground}
      data-cursor-ink={ground === "signal" ? "" : undefined}
      aria-labelledby={block.title ? titleId : undefined}
      aria-label={block.title ? undefined : block.label || undefined}
    >
      <div className={split ? "wrap vt-sec-split" : "wrap"}>
        {head}
        {children ? <div className="vt-sec-body">{children}</div> : null}
      </div>
      {bleed}
    </LiveSection>
  );
}
