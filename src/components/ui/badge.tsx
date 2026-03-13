import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
}

function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-[#e8f0fb] text-[#1e6fcc]",
    success: "bg-[#e8f5ef] text-[#1a7f5a]",
    warning: "bg-[#fef3c7] text-[#b45309]",
    error: "bg-[#fef2f2] text-[#b91c1c]",
    info: "bg-[#e0f2fe] text-[#0e7490]",
    neutral: "bg-[#f5f7fa] text-[#4a5e72]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
