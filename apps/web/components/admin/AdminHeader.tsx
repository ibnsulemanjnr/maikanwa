"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  fullName: string | null;
  phone: string | null;
};

export default function AdminHeader({
  title,
  user,
  onToggleSidebar,
}: {
  title: string;
  user: AdminUser;
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/auth/login?next=/admin");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const initials =
    (user.fullName || user.email)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "A";

  return (
    <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle (optional) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-[#FAFAFA] text-[#111827]"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          <div>
            <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
            <p className="text-sm text-gray-500">Admin console</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Quick links (align with sidebar intent) */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#FAFAFA]"
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#FAFAFA]"
            >
              Account
            </Link>
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-[#FAFAFA]"
            >
              ← Back to Store
            </Link>
          </div>

          {/* Mobile: only Back link */}
          <Link href="/" className="md:hidden text-sm text-gray-600 hover:underline">
            ← Store
          </Link>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="px-4 py-2 rounded-lg bg-[#1E2A78] text-white font-semibold hover:bg-[#2A3A88] disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>

          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#111827]">{user.fullName || "Admin"}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-[#1E2A78] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{initials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
