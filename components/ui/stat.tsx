interface StatProps {
  value: string;
  label: string;
}

export default function Stat({
  value,
  label,
}: StatProps) {
  return (
    <div>
      <h3 className="font-display text-4xl md:text-5xl">
        {value}
      </h3>

      <p className="body-sm text-secondary mt-2">
        {label}
      </p>
    </div>
  );
}