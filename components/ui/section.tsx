import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export default function Section({
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`
        py-24
        md:py-32
        xl:py-40
        ${className}
      `}
    >
      {children}
    </section>
  );
}