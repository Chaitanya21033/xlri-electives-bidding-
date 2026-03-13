import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const iconColors = {
    default: "bg-[#e8f0fb] text-[#1e6fcc]",
    accent: "bg-[#0f2744] text-white",
    success: "bg-[#e8f5ef] text-[#1a7f5a]",
    warning: "bg-[#fef3c7] text-[#b45309]",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#d4dde6] bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#6b7e8f] truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#1c2b3a] tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#9aabba]">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                trend.value >= 0 ? "text-[#1a7f5a]" : "text-[#b91c1c]"
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              <span className="text-[#9aabba] font-normal">{trend.label}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ml-3",
              iconColors[variant]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
