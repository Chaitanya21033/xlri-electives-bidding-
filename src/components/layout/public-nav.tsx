"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GraduationCap, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Solutions", href: "/solutions" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d4dde6] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2744]">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold text-[#0f2744] tracking-tight">
                ElectiVe
              </span>
              <span className="text-[10px] font-medium text-[#1e6fcc] uppercase tracking-widest ml-1">
                Pro
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#4a5e72] hover:text-[#1c2b3a] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#4a5e72] hover:text-[#1c2b3a] transition-colors"
            >
              Sign in
            </Link>
            <Button size="sm" asChild>
              <Link href="/demo">Request Demo</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-md p-1.5 text-[#4a5e72] hover:bg-[#f5f7fa]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#d4dde6] bg-white px-6 pb-4">
          <nav className="flex flex-col gap-1 pt-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#4a5e72] hover:bg-[#f5f7fa] hover:text-[#1c2b3a]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-[#d4dde6]">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#4a5e72] hover:bg-[#f5f7fa]"
              >
                Sign in
              </Link>
              <Button size="sm">
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
