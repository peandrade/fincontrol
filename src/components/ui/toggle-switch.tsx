"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  description?: string;
}

const sizeClasses = {
  sm: {
    track: "w-10 h-5",
    thumb: "w-4 h-4",
    translate: "translate-x-[18px]",
  },
  md: {
    track: "w-14 h-7",
    thumb: "w-6 h-6",
    translate: "translate-x-[26px]",
  },
  lg: {
    track: "w-16 h-8",
    thumb: "w-7 h-7",
    translate: "translate-x-[30px]",
  },
};

/**
 * Reusable toggle switch component
 */
export const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      size = "md",
      className,
      label,
      description,
    },
    ref
  ) => {
    const sizes = sizeClasses[size];

    const toggle = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "relative rounded-full transition-colors duration-200 flex-shrink-0",
          "flex items-center px-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
          sizes.track,
          checked ? "bg-violet-500" : "bg-[var(--bg-hover)]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span
          className={cn(
            "rounded-full bg-white shadow-md",
            "transition-transform duration-200 ease-in-out",
            sizes.thumb,
            checked ? sizes.translate : "translate-x-0"
          )}
        />
      </button>
    );

    if (!label && !description) {
      return toggle;
    }

    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-[var(--text-dimmed)]">{description}</p>
          )}
        </div>
        {toggle}
      </div>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";
