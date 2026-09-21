import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`
        mx-auto
        w-full
        max-w-[1440px]
        px-5
        md:px-8
        xl:px-12
        ${className}
      `}
    >
      {children}
    </div>
  );
}