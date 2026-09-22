import type { HeroIllustration } from "@/lib/types";

/**
 * Line illustrations for the Home hero service cards.
 *
 * Every drawing uses the card's own ink (`currentColor`) with a single orange
 * accent, on a shared 190 × 150 canvas. The `h-*` classes are animated by the
 * hero's styles each time a slide becomes active; elsewhere (the admin preview)
 * they simply render still.
 */

const ORANGE = "#ff6b00";

const INK = { stroke: "currentColor", strokeOpacity: 0.35 } as const;
const MUTED = { fill: "currentColor", fillOpacity: 0.5 } as const;

const delay = (i: number) => ({ animationDelay: `${0.15 + i * 0.08}s` });

/** Browser chrome shared by the screen-based drawings. */
function Browser({ dots = true }: { dots?: boolean }) {
  return (
    <>
      <rect x="1" y="1" width="188" height="148" rx="4" {...INK} />
      <line x1="1" y1="24" x2="189" y2="24" {...INK} />
      {dots ? (
        <>
          <circle cx="13" cy="12.5" r="3" fill="currentColor" fillOpacity="0.35" />
          <circle cx="24" cy="12.5" r="3" fill="currentColor" fillOpacity="0.35" />
          <circle cx="35" cy="12.5" r="3" fill={ORANGE} />
        </>
      ) : null}
    </>
  );
}

function Code() {
  const lines: [number, number, number][] = [
    [18, 44, 58],
    [30, 58, 88],
    [30, 72, 64],
    [42, 86, 76],
    [30, 100, 40],
    [18, 114, 30],
  ];
  return (
    <>
      <Browser />
      {lines.map(([x, y, w], i) => (
        <rect
          key={y}
          className="h-code-line"
          x={x}
          y={y}
          width={w}
          height="4"
          rx="1"
          {...(i === 1 ? { fill: ORANGE } : MUTED)}
          style={delay(i)}
        />
      ))}
      <rect className="h-caret" x="52" y="111" width="2" height="10" fill={ORANGE} />
      <path d="M150 68l-12 12 12 12M166 68l12 12-12 12" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
    </>
  );
}

function Website() {
  return (
    <>
      <Browser />
      <rect className="h-code-line" x="16" y="38" width="96" height="6" rx="1" fill={ORANGE} style={delay(0)} />
      <rect className="h-code-line" x="16" y="52" width="130" height="4" rx="1" {...MUTED} style={delay(1)} />
      <rect className="h-code-line" x="16" y="62" width="104" height="4" rx="1" {...MUTED} style={delay(2)} />
      <rect className="h-pop" x="16" y="76" width="44" height="12" rx="2" stroke="currentColor" strokeOpacity="0.6" style={delay(3)} />
      {[16, 72, 128].map((x, i) => (
        <rect key={x} className="h-bar" x={x} y="100" width="46" height="36" rx="2" {...INK} style={delay(4 + i)} />
      ))}
    </>
  );
}

function WebApp() {
  return (
    <>
      <Browser />
      <line x1="46" y1="24" x2="46" y2="149" {...INK} />
      {[38, 50, 62, 74].map((y, i) => (
        <rect key={y} className="h-code-line" x="10" y={y} width={i === 0 ? 26 : 20} height="4" rx="1" {...(i === 0 ? { fill: ORANGE } : MUTED)} style={delay(i)} />
      ))}
      {[56, 102, 148].map((x, i) => (
        <rect key={x} className="h-pop" x={x} y="36" width="36" height="24" rx="2" {...INK} style={delay(1 + i)} />
      ))}
      <rect x="56" y="70" width="128" height="66" rx="2" {...INK} />
      <path className="h-trend" d="M64 124 L86 110 L106 116 L130 94 L152 100 L176 80" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Software() {
  const boxes: [number, number][] = [
    [14, 20],
    [14, 104],
    [118, 62],
  ];
  return (
    <>
      {boxes.map(([x, y], i) => (
        <rect key={`${x}-${y}`} className="h-pop" x={x} y={y} width="58" height="30" rx="3" {...INK} style={delay(i)} />
      ))}
      <path className="h-trend" d="M72 35 H94 V77 H118 M72 119 H94 V77" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle className="h-pop" cx="94" cy="77" r="6" fill={ORANGE} style={delay(3)} />
      <rect x="24" y="31" width="30" height="4" rx="1" {...MUTED} />
      <rect x="24" y="115" width="24" height="4" rx="1" {...MUTED} />
      <rect x="128" y="73" width="36" height="4" rx="1" fill={ORANGE} />
    </>
  );
}

function UiUx() {
  return (
    <>
      <rect x="50" y="4" width="72" height="142" rx="10" {...INK} />
      <rect x="76" y="11" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.35" />
      <rect className="h-pop" x="60" y="24" width="52" height="34" rx="3" fill="currentColor" fillOpacity="0.14" style={delay(0)} />
      <rect className="h-code-line" x="60" y="66" width="44" height="4" rx="1" {...MUTED} style={delay(1)} />
      <rect className="h-code-line" x="60" y="76" width="34" height="4" rx="1" {...MUTED} style={delay(2)} />
      <rect className="h-pop" x="60" y="92" width="52" height="14" rx="7" fill={ORANGE} style={delay(3)} />
      <rect className="h-code-line" x="60" y="116" width="52" height="4" rx="1" {...MUTED} style={delay(4)} />
      <path className="h-pop" d="M126 104 l0 26 l7 -7 l6 12 l5 -2.5 l-6 -12 l10 0 z" fill="currentColor" style={delay(5)} />
    </>
  );
}

function Cloud() {
  return (
    <>
      <path
        className="h-pop"
        d="M58 70 H134 A22 22 0 0 0 130 26 A30 30 0 0 0 74 20 A24 24 0 0 0 58 70 Z"
        {...INK}
        strokeWidth="1.5"
        style={delay(0)}
      />
      <path d="M96 70 V88" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />
      {[88, 108, 128].map((y, i) => (
        <g key={y} className="h-pop" style={delay(1 + i)}>
          <rect x="52" y={y} width="88" height="16" rx="2" {...INK} />
          <rect x="62" y={y + 6} width="34" height="4" rx="1" {...MUTED} />
          <circle cx="128" cy={y + 8} r="3" fill={i === 0 ? ORANGE : "currentColor"} fillOpacity={i === 0 ? 1 : 0.35} />
        </g>
      ))}
    </>
  );
}

function Social() {
  return (
    <>
      <rect className="h-pop" x="10" y="14" width="112" height="68" rx="6" {...INK} style={delay(0)} />
      <path d="M30 82 L26 98 L46 82" {...INK} strokeLinejoin="round" />
      <rect className="h-code-line" x="24" y="32" width="70" height="4" rx="1" {...MUTED} style={delay(1)} />
      <rect className="h-code-line" x="24" y="44" width="84" height="4" rx="1" {...MUTED} style={delay(2)} />
      <rect className="h-code-line" x="24" y="56" width="52" height="4" rx="1" {...MUTED} style={delay(3)} />
      <path
        className="h-pop"
        d="M150 128 C120 108 124 84 140 84 C146 84 150 88 150 94 C150 88 154 84 160 84 C176 84 180 108 150 128 Z"
        fill={ORANGE}
        style={delay(4)}
      />
      {[64, 84, 104].map((x, i) => (
        <circle key={x} className="h-pop" cx={x} cy="126" r="8" {...INK} style={delay(5 + i)} />
      ))}
    </>
  );
}

function Seo() {
  return (
    <>
      <rect x="1" y="8" width="188" height="26" rx="13" {...INK} />
      <circle cx="20" cy="21" r="6" stroke={ORANGE} strokeWidth="2" />
      <line x1="24.5" y1="25.5" x2="29" y2="30" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" />
      <rect className="h-code-line" x="38" y="19" width="70" height="4" rx="1" {...MUTED} style={delay(0)} />
      {[50, 82, 114].map((y, i) => (
        <g key={y} className="h-pop" style={delay(1 + i)}>
          <rect x="10" y={y} width="8" height="8" fill={i === 0 ? ORANGE : "currentColor"} fillOpacity={i === 0 ? 1 : 0.35} />
          <rect x="26" y={y} width={i === 0 ? 110 : 90} height="5" rx="1" fill="currentColor" fillOpacity={i === 0 ? 0.8 : 0.5} />
          <rect x="26" y={y + 12} width={i === 0 ? 140 : 120} height="3" rx="1" fill="currentColor" fillOpacity="0.25" />
        </g>
      ))}
    </>
  );
}

function Ads() {
  return (
    <>
      {[56, 40, 24].map((r, i) => (
        <circle key={r} className="h-pop" cx="84" cy="80" r={r} stroke="currentColor" strokeOpacity={0.25 + i * 0.12} style={delay(i)} />
      ))}
      <circle className="h-pop" cx="84" cy="80" r="9" fill={ORANGE} style={delay(3)} />
      <path className="h-trend" d="M168 14 L90 74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M168 14 l-12 2 M168 14 l-2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Content() {
  return (
    <>
      <path d="M40 4 H128 L150 26 V146 H40 Z" {...INK} strokeLinejoin="round" />
      <path d="M128 4 V26 H150" {...INK} />
      <rect className="h-code-line" x="54" y="20" width="56" height="6" rx="1" fill="currentColor" fillOpacity="0.8" style={delay(0)} />
      <rect className="h-pop" x="54" y="36" width="82" height="50" rx="2" fill="currentColor" fillOpacity="0.12" style={delay(1)} />
      <path className="h-pop" d="M88 52 L104 61 L88 70 Z" fill={ORANGE} style={delay(2)} />
      {[98, 108, 118, 128].map((y, i) => (
        <rect key={y} className="h-code-line" x="54" y={y} width={[82, 70, 78, 44][i]} height="4" rx="1" {...MUTED} style={delay(3 + i)} />
      ))}
    </>
  );
}

function Email() {
  return (
    <>
      <rect className="h-pop" x="14" y="36" width="140" height="96" rx="4" {...INK} strokeWidth="1.5" style={delay(0)} />
      <path className="h-trend" d="M14 40 L84 92 L154 40" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 128 L64 80 M154 128 L104 80" {...INK} />
      <circle className="h-pop" cx="154" cy="36" r="13" fill={ORANGE} style={delay(2)} />
      <path d="M149 36 l4 4 l7 -8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Growth() {
  const bars: [number, number][] = [
    [16, 34],
    [48, 52],
    [80, 44],
    [112, 74],
    [144, 98],
  ];
  return (
    <>
      <line x1="1" y1="136" x2="189" y2="136" {...INK} />
      {bars.map(([x, h], i) => (
        <rect
          key={x}
          className="h-bar"
          x={x}
          y={136 - h}
          width="22"
          height={h}
          fill="currentColor"
          fillOpacity={i === bars.length - 1 ? 0.9 : 0.14}
          style={delay(i)}
        />
      ))}
      <path
        className="h-trend"
        d="M27 92 L59 74 L91 82 L123 50 L155 24"
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="155" cy="24" r="4.5" fill={ORANGE} />
    </>
  );
}

const DRAWINGS: Record<HeroIllustration, () => React.JSX.Element> = {
  website: Website,
  webapp: WebApp,
  software: Software,
  uiux: UiUx,
  cloud: Cloud,
  code: Code,
  social: Social,
  seo: Seo,
  ads: Ads,
  content: Content,
  email: Email,
  growth: Growth,
};

export default function HeroArt({ name }: { name: HeroIllustration }) {
  const Drawing = DRAWINGS[name] ?? Code;
  return (
    <svg viewBox="0 0 190 150" fill="none" aria-hidden="true">
      <Drawing />
    </svg>
  );
}
