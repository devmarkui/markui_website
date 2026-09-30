/** The homepage's arrow (↗), drawn at 14px and sized by CSS (.btn-arrow). */
export function Arrow({ className = "btn-arrow" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path
        d="M3 11 11 3M4.5 3H11v6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}
