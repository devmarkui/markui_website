import Link from "next/link";

interface ButtonProps {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({
  href = "#",
  children,
  variant = "primary",
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#ff6b00] text-white hover:bg-[#ff7f26]",

    secondary:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10",
  };

  return (
    <Link
      href={href}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-full
        px-6
        py-3
        text-sm
        font-medium
        transition-all
        duration-300
        ${variants[variant]}
      `}
    >
      {children}
    </Link>
  );
}