"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: { container: "w-8 h-8", text: "text-sm", radius: "rounded-lg" },
  md: { container: "w-9 h-9", text: "text-lg", radius: "rounded-xl" },
  lg: { container: "w-12 h-12", text: "text-2xl", radius: "rounded-xl" },
  xl: { container: "w-16 h-16", text: "text-3xl", radius: "rounded-2xl" },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { container, text, radius } = sizes[size];

  return (
    <div
      className={`${container} ${radius} bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary shrink-0 ${className}`}
    >
      <span className={`${text} font-bold text-white`}>$</span>
    </div>
  );
}
