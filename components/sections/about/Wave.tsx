"use client";

import { useSeen } from "@/components/site/hooks";

/**
 * The approach as a line, like the homepage's process scope: pure noise at
 * the first stage, resolving stage by stage into one clean orange sine at
 * the last. The path is fixed (seeded), so it is the same on every visit;
 * it draws itself in the first time it scrolls into view.
 */
const W = 1000;
const H = 160;

function wavePath() {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };
  const mid = H / 2;
  const parts: string[] = [];
  for (let x = 0; x <= W; x += 4) {
    const u = x / W;
    const clean = Math.min(1, Math.max(0, (u - 0.08) / 0.8));
    const noise = (1 - clean) ** 1.5;
    const sine = Math.sin(u * Math.PI * 2 * 7.5) * clean ** 1.8;
    const y = mid + H * 0.44 * (noise * rand() * 0.95 + sine * 0.78);
    parts.push(`${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`);
  }
  return parts.join(" ");
}

const PATH = wavePath();

export default function Wave() {
  const [ref, seen] = useSeen<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      className={seen ? "ab-wave is-in" : "ab-wave"}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ab-wave-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#15110e" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#15110e" />
          <stop offset="0.85" stopColor="#ff6b00" />
          <stop offset="1" stopColor="#ff6b00" />
        </linearGradient>
      </defs>
      <path className="ab-wave-ghost" d={`M0 ${H / 2} H${W}`} />
      <path className="ab-wave-path" d={PATH} pathLength={1} stroke="url(#ab-wave-grad)" />
    </svg>
  );
}
