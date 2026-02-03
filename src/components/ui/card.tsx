import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/5 rounded-2xl",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 pt-6 pb-2", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 mt-1", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 pb-6 pt-4", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 pb-6 pt-0 flex items-center", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

interface SummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  variant: "income" | "expense" | "balance" | "neutral";
}

const summaryCardVariants = {
  income: "from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20",
  expense: "from-orange-500/90 to-red-500/90 shadow-orange-500/20",
  balance: "from-cyan-500/90 to-blue-600/90 shadow-cyan-500/20",
  neutral: "from-[var(--color-primary)]/90 to-[var(--color-secondary)]/90 shadow-primary",
};

const SummaryCard = forwardRef<HTMLDivElement, SummaryCardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-gradient-to-br rounded-2xl p-6 shadow-xl",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        summaryCardVariants[variant],
        className
      )}
      {...props}
    />
  )
);
SummaryCard.displayName = "SummaryCard";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SummaryCard,
};