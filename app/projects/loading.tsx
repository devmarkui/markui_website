/** Shown while the Projects page reads from the store — deliberately plain. */
export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--text-muted, #737373)",
      }}
      aria-busy="true"
    >
      Loading projects…
    </main>
  );
}
