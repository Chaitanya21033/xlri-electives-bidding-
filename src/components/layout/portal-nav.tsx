"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  ChevronDown,
  GraduationCap,
  Award,
  FileText,
  Calendar,
  Shield,
  TrendingUp,
  CheckSquare,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Academic Terms", href: "/admin/terms", icon: Calendar },
  { label: "Bidding Cycles", href: "/admin/cycles", icon: TrendingUp },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Students", href: "/admin/students", icon: GraduationCap },
  { label: "Professors", href: "/admin/professors", icon: Users },
  { label: "Allocations", href: "/admin/allocations", icon: CheckSquare },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Announcements", href: "/admin/announcements", icon: Bell },
  { label: "Audit Log", href: "/admin/audit", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const professorNav: NavItem[] = [
  { label: "Dashboard", href: "/professor", icon: LayoutDashboard },
  { label: "My Courses", href: "/professor/courses", icon: BookOpen },
  { label: "Demand Analytics", href: "/professor/demand", icon: BarChart3 },
  { label: "Allocations", href: "/professor/allocations", icon: CheckSquare },
  { label: "Notifications", href: "/professor/notifications", icon: Bell },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Course Catalog", href: "/student/catalog", icon: BookOpen },
  { label: "My Bids", href: "/student/bids", icon: TrendingUp },
  { label: "Allocations", href: "/student/allocations", icon: Award },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
];

function getNav(role: UserRole) {
  if (role === "ADMIN") return adminNav;
  if (role === "PROFESSOR") return professorNav;
  return studentNav;
}

function getRoleLabel(role: UserRole) {
  if (role === "ADMIN") return "Administrator";
  if (role === "PROFESSOR") return "Faculty";
  return "Student";
}

interface PortalNavProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
}

export function PortalNav({ user }: PortalNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNav(user.role);

  const NavLinks = () => (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" + user.role.toLowerCase() &&
              pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#e8f0fb] text-[#1e6fcc]"
                    : "text-[#4a5e72] hover:bg-[#f5f7fa] hover:text-[#1c2b3a]"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#1e6fcc]" : "text-[#6b7e8f]"
                  )}
                />
                {item.label}
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-[#1e6fcc] px-1.5 py-0.5 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#d4dde6] px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2744]">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-[#0f2744]">ElectiVe</span>
            <span className="ml-0.5 text-xs text-[#6b7e8f] font-normal">
              {" "}Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-[#d4dde6]">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f5f7fa] px-2 py-1 text-xs font-medium text-[#4a5e72]">
          <Shield className="h-3 w-3" />
          {getRoleLabel(user.role)}
        </span>
      </div>

      <NavLinks />

      {/* User footer */}
      <div className="border-t border-[#d4dde6] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f2744] text-white text-xs font-semibold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1c2b3a]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[#9aabba]">{user.email}</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#6b7e8f] hover:bg-[#fef2f2] hover:text-[#b91c1c] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-[#d4dde6] lg:bg-white lg:fixed lg:inset-y-0 lg:z-50">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-[#d4dde6] bg-white px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-[#4a5e72] hover:bg-[#f5f7fa]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0f2744]">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-[#0f2744]">ElectiVe</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 rounded-md p-1.5 text-[#4a5e72] hover:bg-[#f5f7fa]"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
