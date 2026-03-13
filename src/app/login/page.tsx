import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the ElectiVe portal",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-[#d4dde6] bg-white px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0f2744]">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-[#0f2744]">ElectiVe</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#0f2744]">Sign in</h1>
            <p className="mt-2 text-sm text-[#6b7e8f]">
              Access your ElectiVe portal
            </p>
          </div>
          <div className="rounded-xl border border-[#d4dde6] bg-white p-8 shadow-sm">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-xs text-[#9aabba]">
            Having trouble?{" "}
            <Link
              href="/forgot-password"
              className="text-[#1e6fcc] hover:underline"
            >
              Reset your password
            </Link>{" "}
            or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
