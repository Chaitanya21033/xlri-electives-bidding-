"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        return;
      }

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        ADMIN: "/admin",
        PROFESSOR: "/professor",
        STUDENT: "/student",
      };

      const destination =
        callbackUrl || roleRedirects[data.role] || "/student";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-[#fef2f2] border border-[#fecaca] p-3">
          <AlertCircle className="h-4 w-4 text-[#b91c1c] mt-0.5 shrink-0" />
          <p className="text-sm text-[#b91c1c]">{error}</p>
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@institution.edu"
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        autoComplete="current-password"
      />

      <Button type="submit" loading={loading} className="w-full mt-1">
        Sign in to portal
      </Button>

      {/* Demo credentials hint */}
      <div className="rounded-lg bg-[#f5f7fa] border border-[#d4dde6] p-3 mt-1">
        <p className="text-xs font-medium text-[#4a5e72] mb-2">Demo credentials:</p>
        <div className="space-y-1 text-xs text-[#6b7e8f] font-mono">
          <div>Admin: admin@elective.dev / admin123</div>
          <div>Faculty: professor@elective.dev / prof123</div>
          <div>BM Student: bm.student@elective.dev / student123</div>
          <div>HRM Student: hrm.student@elective.dev / student123</div>
        </div>
      </div>
    </form>
  );
}
