import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1c2b3a]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-10 w-full rounded-md border border-[#d4dde6] bg-white px-3 py-2 text-sm text-[#1c2b3a] placeholder:text-[#9aabba]",
            "transition-colors focus-visible:outline-none focus-visible:border-[#1e6fcc] focus-visible:ring-1 focus-visible:ring-[#1e6fcc]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#b91c1c] focus-visible:border-[#b91c1c] focus-visible:ring-[#b91c1c]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#b91c1c]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
