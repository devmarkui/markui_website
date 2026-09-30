/** The channel label that opens every section: "■ 02 —— Projects". */
export default function Chan({
  num,
  children,
  className,
}: {
  num?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={className ? `chan ${className}` : "chan"}>
      <span className="chan-led" aria-hidden="true" />
      {num ? (
        <>
          <span className="chan-num">{num}</span>
          <span className="chan-sep" aria-hidden="true" />
        </>
      ) : null}
      <span>{children}</span>
    </p>
  );
}
