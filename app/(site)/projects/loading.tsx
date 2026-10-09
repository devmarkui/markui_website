/** Shown while the Projects page reads from the store: the dial, tuning. */
export default function Loading() {
  return (
    <main
      id="main"
      className="sx pg"
      aria-busy="true"
      // Dark from top to bottom, so the nav stays clear over it.
      data-mast=""
      style={{
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-label)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ash)",
      }}
    >
      <p className="chan is-live">
        <span className="chan-led" aria-hidden="true" />
        <span>Tuning in to projects…</span>
      </p>
    </main>
  );
}
