import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            {label}
          </label>
        )}

        {}
        <div className="relative">
          {}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}

          {}
          <input
            type={type}
            id={inputId}
            className={cn(

              "w-full h-12 bg-white/5 border rounded-xl text-white placeholder-gray-500",

              "px-4 py-3",

              "focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)]",

              "transition-all duration-200",

              error ? "border-red-500/50" : "border-white/10",

              leftIcon && "pl-12",
              rightIcon && "pr-12",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };